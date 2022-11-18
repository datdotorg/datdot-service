const RAM = require('random-access-memory')
const derive_topic = require('derive-topic')
const download_range = require('_datdot-service-helpers/download-range')
const hypercore = require('hypercore')
const Hyperbeam = require('hyperbeam')
const brotli = require('_datdot-service-helpers/brotli')
const varint = require('varint')
const refresh_discovery_mode = require('_datdot-service-helpers/refresh-discovery-mode')
const { toPromises } = require('hypercore-promisifier')
const FeedStorage = require('_datdot-service-helpers/feed-storage.js')
const sub = require('subleveldown')

const datdot_crypto = require('datdot-crypto')
const proof_codec = require('datdot-codec/proof')

const getRangesCount = require('getRangesCount')
const get_max_index = require('_datdot-service-helpers/get-max-index')

const DEFAULT_TIMEOUT = 17500

// global variables (later local DB)
const organizer = {
  amendments: {},
  feeds: {},
}
  /******************************************************************************
  ROLE: Hoster
******************************************************************************/
module.exports = APIS => {
  
  return hoster

  async function hoster(identity, log) {
    const { chainAPI, vaultAPI, store } = APIS
    const { myAddress, noiseKey: hosterKey } = identity
    log({ type: 'hoster', data: [`Listening to events for hoster role`] })
    const account = await vaultAPI

    await chainAPI.listenToEvents(handleEvent)

    // EVENTS
    async function handleEvent(event) {

      if (event.method === 'RegisteredForHosting') {
        const [userID] = event.data
        const hosterAddress = await chainAPI.getUserAddress(userID)
        if (hosterAddress === myAddress) {
          log({ type: 'hoster', data: [`Event received: ${event.method} ${event.data.toString()}`] })
        }
      }
      if (event.method === 'NewAmendment') {
        const [amendmentID] = event.data
        const amendment = await chainAPI.getAmendmentByID(amendmentID)
        const { hosters, attestors, encoders } = amendment.providers
        const pos = await isForMe(hosters, event).catch(err => { return })
        const encoderSigningKey = await chainAPI.getSigningKey(encoders[pos])
        const { feedKey, attestorKey, plan, ranges, signatures } = await getAmendmentData(attestors, amendment)
        const data = {
          store,
          amendmentID,
          chainAPI,
          account,
          hosterKey,
          encoderSigningKey,
          feedKey,
          attestorKey,
          plan,
          ranges,
          signatures,
          encoder_pos: pos,
          log
        }
        // organizer stuff
        const stringkey = feedKey.toString('hex')
        organizer.amendments[amendmentID] = data
        if (!organizer.feeds[stringkey]) organizer.feeds[stringkey] = { counter: 0 } // TODO: check the last counter on chain and set it to that or else zero

        try {
          const { feed } = await receive_data_and_start_hosting(data)
          log({ type: 'hoster', data: [`Feed loaded`] })
          log({ type: 'hoster', data: [`Hosting for the amendment ${amendmentID} started`] })
          await refresh_discovery_mode({ account, feed, mode: { server: true, client: false }, log })
        } catch (error) { 
          log({ type: 'error', data: { text: 'Caught error from hosting setup (hoster)', error }})
        }
      }
      if (event.method === 'DropHosting') {
        const [feedID, hosterID] = event.data
        const hosterAddress = await chainAPI.getUserAddress(hosterID)
        if (hosterAddress === myAddress) {
          // TODO: close all the connections related to this feed
          log({ type: 'hoster', data: [`Hoster ${hosterID}:  Event received: ${event.method} ${event.data.toString()}`] })
          // const feedKey = await chainAPI.getFeedKey(feedID)
          // const hasKey = await account.storages.has(feedKey.toString('hex'))
          // if (hasKey) return await removeFeed(account, feedKey, amendmentID)
          // TODO: cancel hosting = remove feed, get out of swarm...
        }
      }
      if (event.method === 'NewStorageChallenge') {
        const [id] = event.data
        const storageChallenge = await chainAPI.getStorageChallengeByID(id)
        const hosterID = storageChallenge.hoster
        const hosterAddress = await chainAPI.getUserAddress(hosterID)
        if (hosterAddress === myAddress) {
          log('NewStorageChallenge')
          log({ type: 'hoster', data: [`Hoster ${hosterID}:  Event received: ${event.method} ${event.data.toString()}`] })
          
          const data = await get_storage_challenge_data(storageChallenge)
          data.account = account
          data.log = log
          // log({ type: 'hoster', data: [`sendStorageChallengeToAttestor - ${data}`] })
          await send_storage_proofs_to_attestor(data).catch((error) => log({ type: 'error', data: [`Error: ${JSON.stringify(error)}`] }))
          log({ type: 'hoster', data: [`sendStorageChallengeToAttestor completed`] })
        }
      }
      if (event.method === 'NewPerformanceChallenge') {
        const [performance_challenge_id] = event.data
        const performanceChallenge = await chainAPI.getPerformanceChallengeByID(performance_challenge_id)
        const feed = await chainAPI.getFeedByID(performanceChallenge.feed)
        const stringkey = feed.feedkey.toString('hex')
        if (organizer.feeds[stringkey]) organizer.performance_challenge_id = performance_challenge_id
      }
    }
    // HELPERS
    async function isForMe(hosters, event) {
      return new Promise(async (resolve, reject) => {
        for (var i = 0, len = hosters.length; i < len; i++) {
          const id = hosters[i]
          const peerAddress = await chainAPI.getUserAddress(id)
          if (peerAddress === myAddress) {
            log({ type: 'hoster', data: [`Hoster ${id}:  Event received: ${event.method} ${event.data.toString()}`] })
            resolve(i)
          }
        }
      })
    }
    async function getAmendmentData(attestors, amendment) {
      const contract = await chainAPI.getContractByID(amendment.contract)
      const { ranges, feed: feedID } = contract
      const [attestorID] = attestors
      const attestorKey = await chainAPI.getAttestorKey(attestorID)
      const { feedkey: feedKey, signatures } = await chainAPI.getFeedByID(feedID)
      const objArr = ranges.map(range => ({ start: range[0], end: range[1] }))
      const plan = { ranges: objArr }
      return { feedKey, attestorKey, plan, ranges, signatures }
    }

    async function get_storage_challenge_data (storageChallenge) {
      const { id, checks, hoster: hosterID, attestor: attestorID } = storageChallenge
      const contract_ids = Object.keys(checks).map(stringID => Number(stringID))
      const hosterKey = await chainAPI.getHosterKey(hosterID)
      const attestorKey = await chainAPI.getAttestorKey(attestorID)
      for (var i = 0, len = contract_ids.length; i < len; i++) {
        const contract_id = contract_ids[i]
        const { feed: feedID, ranges, amendments } = await chainAPI.getContractByID(contract_id)
        const [encoderID, pos] = await getEncoderID(amendments, hosterID)

        const { feedkey, signatures }  = await chainAPI.getFeedByID(feedID)
        checks[contract_id].feedKey = feedkey
        // checks[contract_id] = { index, feedKey }
      }
      return { storageChallengeID: id, attestorKey, hosterKey, checks }
    }

    async function getEncoderID (amendments, hosterID) {
      const active_amendment = await chainAPI.getAmendmentByID(amendments[amendments.length-1])
      const pos =  active_amendment.providers.hosters.indexOf(hosterID)
      const encoderID = active_amendment.providers.encoders[pos]
      return [encoderID, pos]
    }
  }


  /* ------------------------------------------- 
        1. GET ENCODED AND START HOSTING
  -------------------------------------------- */

  async function receive_data_and_start_hosting (data) {
    return new Promise (async (resolve,reject) => {
      const { store, account, amendmentID, feedKey, hosterKey, encoderSigningKey, encoder_pos, attestorKey, plan, signatures, ranges, log } = data
      const expectedChunkCount = getRangesCount(ranges)
      await addKey(account, feedKey, plan)
      log({ type: 'hosting setup', data: { text: 'Key added in hosting setup for', amendment: amendmentID } })
      const log2Author = log.sub(`Hoster to author ${feedKey.toString('hex').substring(0,5)} ${attestorKey.toString('hex').substring(0,5)} `)
      const { feed } = await loadFeedData({ account, store, ranges, feedKey, log: log2Author })
      log({ type: 'hosting setup', data: { text: 'Feed loaded', amendment: amendmentID } })
      const opts = { account, store, amendmentID, hosterKey, attestorKey, encoderSigningKey, expectedChunkCount, encoder_pos, feedKey, signatures, ranges, log }
      await getEncodedDataFromAttestor(opts)
      log({ type: 'hosting setup', data: { text: 'Encoded data received and stored', amendment: amendmentID } })
      resolve({ feed })
    })
  }

  async function loadFeedData({ account, store, ranges, feedKey, log }) {
    // replicate feed from author
    const { feed } = await store.load_feed({
      swarm_opts: { topic: datdot_crypto.get_discoverykey(feedKey), mode: { server: true, client: true } },
      feedkey: feedKey, 
      log
    })
    
    var stringkey = feed.key.toString('hex')
    var storage
    log({ type: 'hoster', data: { text: `Feed to author loaded`, stringkey } })
    if (!account.storages.has(stringkey)) {
      log({ type: 'hoster', data: { text: `New storage for feed`, stringkey } })
      const db = sub(account.db, stringkey, { valueEncoding: 'binary' })
      storage = new FeedStorage({ db, feed, log })
      account.storages.set(stringkey, storage)
    } else storage = await getStorage({account, key: feed.key, log})
   

    // make hoster storage for feed
    let all = []
    for (const range of ranges) {
      log({ type: 'hoster', data: {  text: 'Downloading range', ranges, range } })
      all.push(download_range(feed, range))
    }
    await Promise.all(all)
    log({ type: 'hoster', data: {  text: 'All feeds in the range downloaded', ranges } })
    return { feed }
  }

  async function getStorage ({account, key, log}) {
    const stringkey = key.toString('hex')
    storage = await account.storages.get(stringkey)
    log({ type: 'hoster', data: { text: `Existing storage`, stringkey } })
    return storage
  }

  async function getEncodedDataFromAttestor(opts) {
    const { account, store, amendmentID, hosterKey, attestorKey, encoderSigningKey, expectedChunkCount, encoder_pos, feedKey, signatures, ranges, log } = opts
    const log2attestor = log.sub(`hoster to attestor ${attestorKey.toString('hex').substring(0, 5)} amendment ${amendmentID}`)
    log2attestor({ type: 'hoster', data: [`getEncodedDataFromAttestor`] })
    
    const unique_el = `${amendmentID}/${encoder_pos}`
    const all = []
    let counter = 0
    const topic = derive_topic({ senderKey: attestorKey, feedKey, receiverKey: hosterKey, id: amendmentID })
    
    return new Promise(async (resolve, reject) => {
      try {
        await store.load_feed({ // hoster to attestor in hosting setup
          config: { permanent: true},
          swarm_opts: { topic, mode: { server: false, client: true } },
          peers: { peerList: [attestorKey.toString('hex')], onpeer, msg: { receive: { type: 'feedkey' }} },
          log: log2attestor
        })
        log2attestor({ type: 'hoster', data: { text: `feed to attestor loaded` } })
    
        async function onpeer ({ feed }) {
          const all = []
          for (var i = 0; i < expectedChunkCount; i++) {
            log2attestor({ type: 'hoster', data: [`Getting data: counter ${i}`] })
            all.push(store_data(feed.get(i)))
          }
          const results = await Promise.all(all).catch(err => {
            log2attestor({ type: 'error', data: [`Error getting results ${err}`] })
          })
          if (!results) throw new Error({ type: 'fail', data: 'Error storing data' })
          log2attestor({ type: 'hoster', data: { text: `All chunks hosted`, len: results.length, expectedChunkCount } })
          if (results.length !== expectedChunkCount) throw new Error({ type: 'error', data: 'Not enought resolved results' })
          resolve()
        }  
      } catch (err) {
        reject(err)
      }
    })

    async function store_data(chunk_promise) {
      const chunk = await chunk_promise
      const json = chunk.toString('binary')
      const data = proof_codec.decode(json)
      log2attestor({ type: 'hoster', data: [`Downloaded index: ${data.index} from feed replicated from attestor ${attestorKey.toString('hex')}`] })
      return new Promise(async (resolve, reject) => {
        counter++
        const { index, encoded_data, encoded_data_signature, nodes } = data
        log2attestor({ type: 'hoster', data: [`Storing verified message with index: ${data.index}`] })
        const isExisting = await account.storages.has(feedKey.toString('hex'))
        log2attestor({ type: 'hoster', data: [`Is feed storage existing?: ${isExisting}`] })
        // Fix up the JSON serialization by converting things to buffers
        if (!isExisting) {
          const error = { type: 'encoded:error', error: 'UNKNOWN_FEED', ...{ key: feedKey.toString('hex') } }
          // stream.write(error)
          // stream.end()
          return reject(error)
        }
        try {
          // if (!datdot_crypto.verify_signature(encoded_data_signature, encoded_data, encoderSigningKey)) reject(index)
          // log2attestor({ type: 'hoster', data: { text:`Encoder data signature verified`, encoded_data } })
          const decompressed = await brotli.decompress(encoded_data)
          // await datdot_crypto.verify_chunk_hash(index, decompressed, unique_el, nodes).catch(err => reject('not valid chunk hash', err))
          // log2attestor({ type: 'hoster', data: [`Chunk hash verified`] })
          const keys = Object.keys(signatures)
          const indexes = keys.map(key => Number(key))
          const max = get_max_index(ranges)
          const version = indexes.find(v => v >= max)
          // const not_verified = datdot_crypto.merkle_verify({ feedKey, hash_index: index * 2, version, signature: Buffer.from(signatures[version], 'binary'), nodes })
          // if (not_verified) reject(not_verified)
          // log2attestor({ type: 'hoster', data: [`Chunk merkle verified`] })
          await store_in_hoster_storage({
            account,
            feedKey,
            index,
            encoded_data_signature,
            encoded_data,
            unique_el,  // need to store unique_el, to be able to decompress and serve chunks as hosters
            nodes,
            log: log2attestor
          })
          log2attestor({ type: 'hoster', data: [`Hoster received & stored index: ${index} (${counter}/${expectedChunkCount}`] })
          resolve({ type: 'encoded:stored', ok: true, index: data.index })
        } catch (e) {
          // Uncomment for better stack traces
          const error = { type: 'encoded:error', error: `ERROR_STORING: ${e.message}`, ...{ e }, data }
          log2attestor({ type: 'error', data: [`Error: ${JSON.stringify(error)}`] })
          // beam1.destroy()
          return reject(error)
        }
      })
    }
  }

  

  async function removeFeed(account, key, log) {
    log({ type: 'hoster', data: [`Removing the feed`] })
    const stringKey = key.toString('hex')
    const storage = await getStorage({account, key, log})
    if (storage) account.storages.delete(stringKey)
    await removeKey(key)
  }


  async function watchFeed(account, feed) {
    warn('Watching is not supported since we cannot ask the chain for attestors')
    /* const stringKey = feed.key.toString('hex')
    if (account.watchingFeeds.has(stringKey)) return
    account.watchingFeeds.add(stringKey)
    feed.on('update', onUpdate)
    async function onUpdate () {
      await loadFeedData(feed.key, ...)
    } */
  }

  async function store_in_hoster_storage({ account, feedKey, index, encoded_data_signature, encoded_data, unique_el, nodes, log }) {
    const storage = getStorage({account, key: feedKey, log})
    return storage.storeEncoded({
      index,
      encoded_data_signature,
      encoded_data,
      unique_el,
      nodes,
    })
  }

  async function getDataFromStorage(account, key, index, log) {
    const storage = getStorage({account, key, log})
    const data = await storage.getProofOfStorage(index)
    log({ type: 'storage challenge', data: { text: 'Got encoded data from storage', data }})
    return data
  }

  async function saveKeys(account, keys) {
    await account.hosterDB.put('all_keys', keys)
  }

  async function addKey(account, key, options) {
    const stringKey = key.toString('hex')
    const existing = (await account.hosterDB.get('all_keys').catch(e => { })) || []
    const data = { key: stringKey, options }
    const final = existing.concat(data)
    await saveKeys(account, final)
  }

  async function removeKey(account, key) {
    log({ type: 'hoster', data: [`Removing the key`] })
    const stringKey = key.toString('hex')
    const existing = (await account.hosterDB.get('all_keys').catch(e => { })) || []
    const final = existing.filter((data) => data.key !== stringKey)
    await saveKeys(account, final)
    log({ type: 'hoster', data: [`Key removed`] })
  }

  async function close() {
    // Close the DB and hypercores
    for (const storage of account.storages.values()) {
      await storage.close()
    }
  }

  /* ------------------------------------------- 
      2. CHALLENGES
  -------------------------------------------- */

  async function send_storage_proofs_to_attestor(data) {
    const { storageChallengeID: id, attestorKey, hosterKey, checks, account, log } = data
    const sent_chunks = {}
    return new Promise(async (resolve, reject) => {
      const log2attestor4Challenge = log.sub(`<-Attestor4challenge ${attestorKey.toString('hex').substring(0, 5)}/id`)
      const topic = [hosterKey, attestorKey, id].join('')
      const tid = setTimeout(() => {
        // beam.destroy()
        reject({ type: `attestor_timeout` })
      }, DEFAULT_TIMEOUT)

      const beam = new Hyperbeam(topic)
      beam.on('error', err => {
        log({ type: 'fail', data: err })
        clearTimeout(tid)
        // beam.destroy()
        if (beam_once) {
          // beam_once.destroy()
          reject({ type: `attestor_connection_fail`, data: err })
        }
      })
      const core = toPromises(new hypercore(RAM, { valueEncoding: 'binary' }))
      await core.ready()
      core.on('error', err => {
        Object.keys(checks).forEach(({ reject }) => reject(err))
      })
      const coreStream = core.replicate(false, { live: true, ack: true })
      coreStream.pipe(beam).pipe(coreStream)
      coreStream.on('ack', ack => {
        const index = ack.start
        const resolve = sent_chunks[index].resolve
        delete sent_chunks[index]
        resolve('attestor received storage proofs')
      })

      const once_topic = topic + 'once'
      var beam_once = new Hyperbeam(once_topic)
      beam_once.on('error', err => {
        clearTimeout(tid)
        // beam_once.destroy()
        // beam.destroy()
        reject({ type: `hoster_connection_fail`, data: err })
      })
      beam_once.write(JSON.stringify({ type: 'feedkey', feedkey: core.key.toString('hex') }))

      const all = []
      const contract_ids = Object.keys(checks).map(stringID => Number(stringID))
      for (var i = 0; i < contract_ids.length; i++) {
        const contractID = contract_ids[i]
        const { index, feedKey } = checks[contractID]
        log2attestor4Challenge({ type: 'hoster', data: { text: 'Next check', check: checks[contractID], contractID, checks} })
        const message = await getDataFromStorage(account, feedKey, index, log2attestor4Challenge)
        if (!message) return
        message.type = 'proof'
        message.contractID = contractID
        log2attestor4Challenge({ type: 'hoster', data: [`Storage proof: appending chunk ${i} for index ${index}`] })
        all.push(send(message, i))
      }

      try {
        const results = await Promise.all(all).catch((error) => {
          log2attestor4Challenge({ type: 'fail', data: error })
          clearTimeout(tid)
          // beam_once.destroy()
          // beam.destroy()
          reject({ type: `hoster_proof_fail`, data: error })
        })
        if (!results) {
          log2attestor4Challenge.log({ type: 'fail', data: 'storage challenge failed (hoster)' })
          log2attestor4Challenge({ type: 'error', data: [`No results`] })
        }
        // send signed storageChallengeID as an extension message
        var ext = core.registerExtension(`datdot-storage-challenge`, { encoding: 'binary ' })
        const messageBuf = Buffer.alloc(varint.encodingLength(id))
        varint.encode(id, messageBuf, 0)
        const dataBuf = account.sign(messageBuf)
        ext.broadcast(dataBuf)

        log2attestor4Challenge({ type: 'hoster', data: [`${all.length} responses received from the attestor`] })
        clearTimeout(tid)
        // beam_once.destroy()
        // beam.destroy()
        resolve({ type: `DONE`, data: results })
      } catch (err) {
        log2attestor4Challenge({ type: 'error', data: [`Error: ${err}`] })
        clearTimeout(tid)
        // beam_once.destroy()
        // beam.destroy()
        reject({ type: `hoster_proof_fail`, data: err })
      }
      
      function send (message, i) {
        return new Promise(async (resolve, reject) => {
          await core.append(JSON.stringify(message))
          sent_chunks[i] = { resolve, reject }
        })
      }
    })
  }
}