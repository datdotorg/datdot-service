const RAM = require('random-access-memory')
const derive_topic = require('derive-topic')
const download_range = require('_datdot-service-helpers/download-range')
const hypercore = require('hypercore')
const Hyperbeam = require('hyperbeam')
const brotli = require('_datdot-service-helpers/brotli')
const parse_decompressed = require('_datdot-service-helpers/parse-decompressed')
const varint = require('varint')
const hosterStorage = require('_datdot-service-helpers/hoster-storage.js')
const sub = require('subleveldown')
const {done_task_cleanup} = require('_datdot-service-helpers/done-task-cleanup')
const b4a = require('b4a')

const datdot_crypto = require('datdot-crypto')
const proof_codec = require('datdot-codec/proof')

const getRangesCount = require('getRangesCount')

const DEFAULT_TIMEOUT = 10000 // has to be high

/******************************************************************************
  ROLE: Hoster
******************************************************************************/
module.exports = APIS => {
  
  return hoster

  async function hoster(vaultAPI) {
    const account = vaultAPI
    const { identity, log, hyper } = account
    const { chainAPI } = APIS

    const { myAddress, noiseKey: hosterKey } = identity
    // log({ type: 'hoster', data: { text: `Listening to events for hoster role` } })

    await chainAPI.listenToEvents(handleEvent)

    // EVENTS
    async function handleEvent(event) {

      if (event.method === 'RegisteredForHosting') {
        const [userID] = event.data
        const hosterAddress = await chainAPI.getUserAddress(userID)
        if (hosterAddress === myAddress) {
          log({ type: 'hoster', data: { text: `Event received: ${event.method} ${event.data.toString()}` } })
        }
      }
      else if (event.method === 'NewAmendment') {
        const [amendmentID] = event.data
        const amendment = await chainAPI.getAmendmentByID(amendmentID)
        const { hosters, attesters, encoders } = amendment.providers
        const pos = await isForMe(hosters)
        if (pos === undefined) return // pos can be 0

        log({ type: 'hoster', data: { text: `Event received: ${event.method} ${event.data.toString()}` } })
        const encoderSigningKey = await chainAPI.getSigningKey(encoders[pos])
        const { feedKey, attesterKey, plan, ranges, signatures } = await getAmendmentData(attesters, amendment)
        const data = {
          hyper,
          amendmentID,
          chainAPI,
          account,
          hosterKey,
          encoderSigningKey,
          feedKey,
          attesterKey,
          plan,
          ranges,
          signatures,
          encoder_pos: pos,
          log
        }

        try {
          const { feed } = await receive_data_and_start_hosting(data)
          log({ type: 'hoster', data: {  text: `Hosting for the amendment ${amendmentID} started`, feedkey: feed.key.toString('hex') } })
        } catch (error) { 
          log({ type: 'error', data: { text: 'Caught error from hosting setup (hoster)', error }})
        }
      }
      else if (event.method === 'HostingStarted') {
        const [amendmentID] = event.data
      }
      else if (event.method === 'DropHosting') {
        const [feedID, hosterID] = event.data
        const hosterAddress = await chainAPI.getUserAddress(hosterID)
        if (hosterAddress === myAddress) {
          log({ type: 'hoster', data: {  text: `Hoster ${hosterID}:  Event received: ${event.method} ${event.data.toString()}` } })
          // const feedKey = await chainAPI.getFeedKey(feedID)
          // const hasKey = await account.storages.has(feedKey.toString('hex'))
          // if (hasKey) return await removeFeed(account, feedKey, amendmentID)
          // TODO: cancel hosting = remove feed, get out of swarm...
        }
      }
      else if (event.method === 'NewStorageChallenge') {
        const [id] = event.data
        const storageChallenge = await chainAPI.getStorageChallengeByID(id)
        const hosterID = storageChallenge.hoster
        const hosterAddress = await chainAPI.getUserAddress(hosterID)
        if (hosterAddress !== myAddress) return
        log({ type: 'hoster', data: { text: `Hoster ${hosterID}:  Event received: ${event.method} ${event.data.toString()}` } })
        try {
          const data = await get_storage_challenge_data(storageChallenge)
          await send_storage_proofs_to_attester({ data, account, log })
          log({ type: 'hoster', data: { text: `sendStorageChallengeToAttester completed` } })
        } catch (err) {
          log({ type: 'error', data: { text: `Error: ${JSON.stringify(err)}` } })
        }
      }
      else if (event.method === 'NewPerformanceChallenge') {
        const [performance_challenge_id] = event.data
        const performanceChallenge = await chainAPI.getPerformanceChallengeByID(performance_challenge_id)
        const feed = await chainAPI.getFeedByID(performanceChallenge.feed)
        const stringkey = feed.feedkey.toString('hex')
      }
    }
    // HELPERS
    async function isForMe(hosters) {
      for (var i = 0, len = hosters.length; i < len; i++) {
        const id = hosters[i]
        const peerAddress = await chainAPI.getUserAddress(id)
        if (peerAddress === myAddress) return i
      }
    }
    async function getAmendmentData(attesters, amendment) {
      const contract = await chainAPI.getContractByID(amendment.contract)
      const { ranges, feed: feedID } = contract
      const [attesterID] = attesters
      const attesterKey = await chainAPI.getAttesterKey(attesterID)
      const { feedkey: feedKey, signatures } = await chainAPI.getFeedByID(feedID)
      const objArr = ranges.map(range => ({ start: range[0], end: range[1] }))
      const plan = { ranges: objArr }
      return { feedKey, attesterKey, plan, ranges, signatures }
    }

    async function get_storage_challenge_data (storageChallenge) {
      const { id: challenge_id, checks, hoster: hosterID, attester: attesterID } = storageChallenge
      const contract_ids = Object.keys(checks).map(string_id => Number(string_id))
      const hosterKey = await chainAPI.getHosterKey(hosterID)
      const attesterKey = await chainAPI.getAttesterKey(attesterID)
      var feedkey_1
      for (const id of contract_ids) {
        const { feed: feedID, ranges, amendments } = await chainAPI.getContractByID(id)
        const [encoderID, pos] = await getEncoderID(amendments, hosterID)
        const { feedkey, signatures }  = await chainAPI.getFeedByID(feedID)
        if (!feedkey_1) feedkey_1 = feedkey
        checks[id].feedKey = feedkey
        // checks[id] = { index, feedKey }
      }
      return { challenge_id, attesterKey, hosterKey, checks, feedkey_1 }
    }

    async function getEncoderID (amendments, hosterID) {
      const active_amendment = await chainAPI.getAmendmentByID(amendments[amendments.length-1])
      const pos =  active_amendment.providers.hosters.indexOf(hosterID)
      const encoderID = active_amendment.providers.encoders[pos]
      return [encoderID, pos]
    }
  }


  /* ------------------------------------------- 
        1. HOSTING SETUP / GET ENCODED AND START HOSTING
  -------------------------------------------- */

  async function receive_data_and_start_hosting (data) {
    return new Promise (async (resolve,reject) => {
      const { hyper, account, amendmentID, feedKey, hosterKey, encoderSigningKey, encoder_pos, attesterKey, plan, signatures, ranges, log } = data
      const expectedChunkCount = getRangesCount(ranges)
      await addKey(account, feedKey, plan)
      const log2Author = log.sub(`Hoster to author, me: ${account.noisePublicKey.toString('hex').substring(0,5)} `)
      log({ type: 'hoster', data: { text: 'load feed', amendment: amendmentID } })
      const { feed } = await loadFeedData({ account, hyper, ranges, feedKey, log: log2Author })
      const opts = { account, hyper, amendmentID, hosterKey, attesterKey, expectedChunkCount, encoderSigningKey, encoder_pos, feedKey, log }
      await getEncodedDataFromAttester(opts)
      resolve({ feed })
    })
  }

  async function loadFeedData({ account, hyper, ranges, feedKey, log }) {
    try {
      const topic = datdot_crypto.get_discoverykey(feedKey)
      const { feed } = await hyper.new_task({ feedkey: feedKey, topic, log })

      // replicate feed from author
      await hyper.connect({ 
        swarm_opts: { role: 'hoster2author', topic, mode: { server: true, client: true } }, 
        log
      })
      
      var stringkey = feed.key.toString('hex')
      var storage
      log({ type: 'hoster', data: { text: `load feed`, stringkey } })
      if (!account.storages.has(stringkey)) {
        log({ type: 'hoster', data: { text: `New storage for feed`, stringkey } })
        const db = sub(account.db, stringkey, { valueEncoding: 'binary' })
        storage = new hosterStorage({ db, feed, log }) // comes with interecepting the feeds
        account.storages.set(stringkey, storage)
      } else storage = await getStorage({account, key: feed.key, log})
     
      // make hoster storage for feed
      let downloaded = []
      for (const range of ranges) { downloaded.push(download_range(feed, range)) }
      await Promise.all(downloaded)
      log({ type: 'hoster', data: {  text: 'all ranges downloaded', ranges } }) 
      await done_task_cleanup({ role: 'hoster2author', topic: feed.discoveryKey, state: account.state, log })                   
      return { feed }
    } catch (err) {
      log({ type: 'Error', data: {  text: 'Error: loading feed data', err } })
    }
  }

  async function getStorage ({account, key, log}) {
    const stringkey = key.toString('hex')
    storage = await account.storages.get(stringkey)
    log({ type: 'hoster', data: { text: `Existing storage`, stringkey } })
    return storage
  }

  async function getEncodedDataFromAttester(opts) {
    const { account, hyper, amendmentID, hosterKey, attesterKey, expectedChunkCount, encoderSigningKey, encoder_pos, feedKey, log } = opts
    const log2attester = log.sub(`hoster to attester, me: ${account.noisePublicKey.toString('hex').substring(0,5)}, peer: ${attesterKey.toString('hex').substring(0,5)} amendment ${amendmentID}`)
    const remotestringkey = attesterKey.toString('hex')
    const unique_el = `${amendmentID}/${encoder_pos}`
    const topic = derive_topic({ senderKey: attesterKey, feedKey, receiverKey: hosterKey, id: amendmentID, log })
    let counter = 0
    return new Promise(async (resolve, reject) => {
      try {
        // hoster to attester in hosting setup
        await hyper.new_task({ newfeed: false, topic, log: log2attester })
        log2attester({ type: 'hoster', data: { text: `load feed`, attester: remotestringkey } })
        await hyper.connect({
          swarm_opts: { role: 'hoster2attester', topic, mode: { server: false, client: true } },
          targets: { targetList: [remotestringkey], ontarget: onattester, msg: { receive: { type: 'feedkey' }}, done },
          log: log2attester
        })
        async function onattester ({ feed }) {
          log2attester({ type: 'hoster', data: { text: `Connected to the attester` } })
          const all = []
          for (var i = 0; i < expectedChunkCount; i++) all.push(store_data(feed.get(i)))
          try {
            const results = await Promise.all(all)
            log2attester({ type: 'hoster', data: { text: `All chunks hosted`, len: results.length, expectedChunkCount } })
            await send_proof_of_contact({ account, unique_el, remotestringkey, topic, log })
          } catch (err) {
            log({ type: 'error', data: { text: `Error getting results` } })
            return reject(new Error({ type: 'fail', data: 'Error storing data' }))
          }
        }
        async function done () {
          await done_task_cleanup({ role: 'hoster2attester', topic, remotestringkey, state: account.state, log: log2attester })
          return resolve()
        }
      } catch (err) {
        return reject(err)
      }
    })

    async function store_data(chunk_promise) {
      return new Promise(async (resolve, reject) => {
        const chunk = await chunk_promise
        const json = chunk.toString()
        const data = proof_codec.decode(json)
        let { index, encoded_data, encoded_data_signature, p } = data
        log2attester({ type: 'hoster', data: { text: `Got index: ${data.index}`, p } })
        counter++
        try { 
          // TODO: Fix up the JSON serialization by converting things to buffers
          const hasStorage = await account.storages.has(feedKey.toString('hex'))
          if (!hasStorage) { return reject({ type: 'Error', error: 'UNKNOWN_FEED', ...{ key: feedKey.toString('hex') } }) }
          // 1. verify encoder signature
          if (!datdot_crypto.verify_signature(encoded_data_signature, encoded_data, encoderSigningKey)) reject(index)
          // 2. verify proof
          p = proof_codec.to_buffer(p)
          const proof_verified = await datdot_crypto.verify_proof(p, feedKey)
          if (!proof_verified) return reject('not a valid proof')
          // 3. verify chunk (see if hash matches the proof node hash)
          const decompressed = await brotli.decompress(encoded_data)
          const decoded = parse_decompressed(decompressed, unique_el)
          const block_verified = await datdot_crypto.verify_block(p, decoded)
          if (!block_verified) return reject('not a valid chunk hash')

          await store_in_hoster_storage({
            account,
            feedKey,
            index,
            encoded_data_signature,
            encoded_data,
            unique_el,  // need to store unique_el, to be able to decompress and serve chunks as hosters
            p,
            log: log2attester
          })
          log2attester({ type: 'hoster', data: { text: `stored index: ${index} (${counter}/${expectedChunkCount}` } })
          return resolve({ type: 'encoded:stored', ok: true, index: data.index })
        } catch (e) {
          const error = { type: 'encoded:error', error: `ERROR_STORING: ${e}`, data }
          log2attester({ type: 'error', data: { text: `Error: ${JSON.stringify(error)}` } })
          return reject(error)
        }
      })
    }
  }

  async function store_in_hoster_storage({ account, feedKey, index, encoded_data_signature, encoded_data, unique_el, p, log }) {
    const storage = await getStorage({account, key: feedKey, log})
    return storage.storeEncoded({
      index,
      encoded_data_signature,
      encoded_data,
      unique_el,
      p
    })
  }

  async function getDataFromStorage(account, key, index, log) {
    const storage = await getStorage({account, key, log})
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
    log({ type: 'hoster', data: { text: `Removing the key` } })
    const stringKey = key.toString('hex')
    const existing = (await account.hosterDB.get('all_keys').catch(e => { })) || []
    const final = existing.filter((data) => data.key !== stringKey)
    await saveKeys(account, final)
    log({ type: 'hoster', data: { text: `Key removed` } })
  }
  async function removeFeed(account, key, log) {
    log({ type: 'hoster', data: { text: `Removing the feed` } })
    const stringKey = key.toString('hex')
    const storage = await getStorage({account, key, log})
    if (storage) account.storages.delete(stringKey)
    await removeKey(key)
  }
  async function watchFeed(account, feed) {
    warn('Watching is not supported since we cannot ask the chain for attesters')
    /* const stringKey = feed.key.toString('hex')
    if (account.watchingFeeds.has(stringKey)) return
    account.watchingFeeds.add(stringKey)
    feed.on('update', onUpdate)
    async function onUpdate () {
      await loadFeedData(feed.key, ...)
    } */
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
  
  async function send_storage_proofs_to_attester({ data, account, log: parent_log }) {
    return new Promise(async (resolve, reject) => {
      const tid = setTimeout(() => {
        return reject({ type: `attester_timeout` })
      }, DEFAULT_TIMEOUT)
      
      const { hyper } = account
      const sent_chunks = {}
      const { challenge_id, attesterKey, hosterKey, checks, feedkey_1 } = data
      
      const log = parent_log.sub(`<-hoster2attester storage challenge, me: ${hosterKey.toString('hex').substring(0,5)}, peer: ${attesterKey.toString('hex').substring(0, 5)} `)
      
      const topic = derive_topic({ senderKey: hosterKey, feedKey: feedkey_1, receiverKey: attesterKey, id: challenge_id, log })
      const { feed } = await hyper.new_task({ topic, log })
      log({ type: 'hoster', data: { text: `New task added (storage hoster)` } })
      
      
      await hyper.connect({ 
        swarm_opts: { role: 'storage_hoster', topic, mode: { server: true, client: false } },
        targets: { feed, targetList: [ attesterKey.toString('hex') ], ontarget: onattester, msg: { send: { type: 'feedkey' }, done } },
        log
      })
      
      async function onattester ({ feed, remotestringkey }) {
        log({ type: 'hoster', data: { text: `Connected to the storage chalenge attester` } })
        const logStorageChallenge = parent_log.sub(`<-hoster2attester storage challenge, me: ${hosterKey.toString('hex').substring(0,5)}, peer: ${attesterKey.toString('hex').substring(0,5)}`)
          
        try {
          const appended = []
          const contract_ids = Object.keys(checks).map(stringID => Number(stringID))
          for (var i = 0; i < contract_ids.length; i++) {
            const contractID = contract_ids[i]
            const { index, feedKey } = checks[contractID]
            logStorageChallenge({ type: 'hoster', data: { text: 'Next check', check: checks[contractID], contractID, checks} })
            const message = await getDataFromStorage(account, feedKey, index, logStorageChallenge)
            if (!message) return
            message.type = 'proof'
            message.contractID = contractID
            message.p = message.p.toString()
            message.p = message.p.toString('binary')
            logStorageChallenge({ type: 'hoster', data: { text: `Storage proof: appending chunk ${i} for index ${index}` } })
            appended.push(send(message, i))
          }
          await Promise.all(appended)
          send_proof_of_contact({ 
            account, 
            unique_el: `${challenge_id}`, 
            remotestringkey: attesterKey.toString('hex'), 
            topic, 
            log 
          })
      
          logStorageChallenge({ type: 'hoster', data: { text: `${appended.length} appended to the attester` } })
        } catch (err) {
          logStorageChallenge({ type: 'error', data: { text: `Error: ${err}` } })
          clearTimeout(tid)
          return reject({ type: `hoster_proof_fail`, data: err })
        }
            
          function send (message, i) {
            return new Promise(async (resolve, reject) => {
              await feed.append(proof_codec.encode(message))
              resolve()
            })
          }
      }

      function done () {
        clearTimeout(tid)
        return resolve({ type: `DONE` })
      }
    })
    
  }
}

  /* ------------------------------------------- 
      3. HELPERS
  -------------------------------------------- */

  async function send_proof_of_contact ({ account, unique_el, remotestringkey, topic, log }) {
    try {
      const data = b4a.from(unique_el, 'binary')
      const proof_of_contact = account.sign(data)
      const channel = account.state.sockets[remotestringkey].channel
      const stringtopic = topic.toString('hex')
      const string_msg = channel.messages[0]
      console.log('string msg - proof of contact', data, unique_el, proof_of_contact)
      string_msg.send(JSON.stringify({ type: 'proof-of-contact', stringtopic, proof_of_contact: proof_of_contact.toString('hex') }))
    } catch (err) {
      log({ type: 'Error', data: {  text: 'Error: send_proof_of_contact', err } })
      return reject('sending proof of contact failed')
    }
  }
