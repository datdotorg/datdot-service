const hypercore = require('hypercore')
const RAM = require('random-access-memory')
const { toPromises } = require('hypercore-promisifier')
const Hyperbeam = require('hyperbeam')
const derive_topic = require('derive_topic')
const getRangesCount = require('getRangesCount')
const hyperswarm = require('hyperswarm')
const ready = require('hypercore-ready')
const sub = require('subleveldown')
const defer = require('promise-defer')
const HosterStorage = require('hoster-storage')
const DEFAULT_TIMEOUT = 7500
/******************************************************************************
  ROLE: Hoster
******************************************************************************/
module.exports = hoster

async function hoster (identity, log, APIS) {
  const { serviceAPI, chainAPI, vaultAPI } = APIS
  const { myAddress, noiseKey: hosterKey } = identity
  log({ type: 'hoster', data: [`Listening to events for hoster role`] })

  await chainAPI.listenToEvents(handleEvent)

  // EVENTS
  async function handleEvent (event) {
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
      const contract = await chainAPI.getContractByID(amendment.contract)
      const { hosters, attestors } = amendment.providers
      if (!await isForMe(hosters, event)) return
      const { feedKey, attestorKey, plan, ranges } = await getHostingData(attestors, contract)
      const data = { amendmentID, account: vaultAPI, hosterKey, feedKey, attestorKey, plan, ranges, log }
      data.account = await vaultAPI
      await receive_data_and_start_hosting(data).catch((error) => log({ type: 'error', data: [`Error: ${error}`] }))
      log({ type: 'hoster', data: [`Hosting for the amendment ${amendmentID} started`] })
    }
    if (event.method === 'DropHosting') {
      const [feedID, hosterID] = event.data
      const hosterAddress = await chainAPI.getUserAddress(hosterID)
      if (hosterAddress === myAddress) {
        // TODO close all the connections related to this feed
        log({ type: 'hoster', data: [`Hoster ${hosterID}:  Event received: ${event.method} ${event.data.toString()}`] })
        // const feedKey = await chainAPI.getFeedKey(feedID)
        // const hasKey = await account.storages.has(feedKey.toString('hex'))
        // if (hasKey) return await removeFeed(account, feedKey)
        // TODO cancel hosting = remove feed, get out of swarm...
      }
    }
    if (event.method === 'NewStorageChallenge') {
      log({ type: 'hoster', data: [`NewStorageChallenge event for hoster`] })
      const [id] = event.data
      const storageChallenge = await chainAPI.getStorageChallengeByID(id)
      const contract = await chainAPI.getContractByID(storageChallenge.contract)
      const hosterID = storageChallenge.hoster
      const hosterAddress = await chainAPI.getUserAddress(hosterID)
      if (hosterAddress === myAddress) {
        log({ type: 'hoster', data: [`Hoster ${hosterID}:  Event received: ${event.method} ${event.data.toString()}`] })
        const data = await getStorageChallengeData(storageChallenge, contract, log)
        data.account = await vaultAPI
        data.hosterKey = hosterKey
        data.log = log
        // log({ type: 'hoster', data: [`sendStorageChallengeToAttestor - ${data}`] })
        await send_storage_proofs_to_attestor(data).catch((error) => log({ type: 'error', data: [`Error: ${JSON.stringify(error)}`] }))
        log({ type: 'hoster', data: [`sendStorageChallengeToAttestor completed`] })
      }
    }
  }
  // HELPERS
  async function isForMe (hosters, event) {
    for (var i = 0, len = hosters.length; i < len; i++) {
      const id = hosters[i]
      const peerAddress = await chainAPI.getUserAddress(id)
      if (peerAddress === myAddress) {
        log({ type: 'hoster', data: [`Hoster ${id}:  Event received: ${event.method} ${event.data.toString()}`] })
        return true
      }
    }
  }
  async function getHostingData (attestors, contract) {
    const ranges = contract.ranges
    const [attestorID] = attestors
    const attestorKey = await chainAPI.getAttestorKey(attestorID)
    const feedID = contract.feed
    const feedKey = await chainAPI.getFeedKey(feedID)
    const objArr = ranges.map(range => ({ start: range[0], end: range[1] }))
    const plan = { ranges: objArr }
    return { feedKey, attestorKey, plan, ranges }
  }
  

  async function getStorageChallengeData (storageChallenge, contract, log) {
    const feedID = contract.feed
    const feedKey = await chainAPI.getFeedKey(feedID)
    const attestorID = storageChallenge.attestor
    const attestorKey = await chainAPI.getAttestorKey(attestorID)
    return { feedKey, attestorKey, storageChallenge }
  }
}

/* ------------------------------------------- 
      1. GET ENCODED AND START HOSTING
-------------------------------------------- */

async function receive_data_and_start_hosting (data) {
  const { account, amendmentID, feedKey, hosterKey, attestorKey, plan, ranges, log } = data
  await addKey(account, feedKey, plan)
  await loadFeedData(account, ranges, feedKey, log)    
  await getEncodedDataFromAttestor({ account, amendmentID, hosterKey, attestorKey, feedKey, ranges, log })
}
  
async function getEncodedDataFromAttestor ({ account, amendmentID, hosterKey, attestorKey, feedKey, ranges, log }) {
  const log2attestor = log.sub(`<-Attestor ${attestorKey.toString('hex').substring(0,5)}`)

  return new Promise(async (resolve, reject) => {
    const expectedChunkCount = getRangesCount(ranges)
    const all_hosted = []
    let counter = 0
    
    // connect to attestor
    const topic_attestor1 = derive_topic({ senderKey: attestorKey, feedKey, receiverKey: hosterKey, id: amendmentID })
    const beam1 = new Hyperbeam(topic_attestor1)
    
    // get the key and replicate attestor hypercore
    const temp_topic1 = topic_attestor1 + 'once'
    const beam_temp1 = new Hyperbeam(temp_topic1)
    beam_temp1.once('data', async (data) => {
      const message = JSON.parse(data.toString('utf-8'))
      if (message.type === 'feedkey') replicate(Buffer.from(message.feedkey, 'hex'))
    })
    
    async function replicate (feedkey) {
      const clone1 = toPromises(new hypercore(RAM, feedkey, {
        valueEncoding: 'utf-8',
        sparse: true
      }))
      
      // pipe streams
      const clone1Stream = clone1.replicate(false, { live: true })
      clone1Stream.pipe(beam1).pipe(clone1Stream)
      
      // // get replicated data
      for (var i = 0; i < expectedChunkCount; i++) {
        log2attestor({ type: 'hoster', data: [`Getting data: counter ${i}`] })
        all_hosted.push(store_data(account, clone1.get(i)))
        // beam_temp1.destroy()
      }

      // resolve
      const results = await Promise.all(all_hosted).catch(err => {
        log2attestor({ type: 'error', data: [`Error getting results ${err}`] })
      })
      if (!results) console.log('Error storing data')
      // console.log({results})
      if (results.length === expectedChunkCount) {
        log2attestor({ type: 'hoster', data: [`All data (${expectedChunkCount} chunks) successfully hosted`] })
        // beam1.destroy()
        resolve(`All data chunks successfully hosted`)
      }
  
      // store data
      async function store_data (account, data_promise) {
        const message = await data_promise
        const data = JSON.parse(message.toString('utf-8'))
        log2attestor({ type: 'hoster', data: [`RECV_MSG with index: ${data.index} from attestor ${attestorKey.toString('hex')}`] })
        
        return new Promise(async (resolve, reject) => {
          counter++
          const { type } = data
          if (type === 'verified') {
            if (!is_valid_data(data)) return
            const { feed, index, encoded, proof, nodes, signature } = data
            log2attestor({ type: 'hoster', data: [`Storing verified message with index: ${data.index}`] })
            const key = Buffer.from(feed)
            const stringKey = key.toString('hex')
            const isExisting = await account.storages.has(stringKey)
            // Fix up the JSON serialization by converting things to buffers
            for (const node of nodes) node.hash = Buffer.from(node.hash)
            if (!isExisting) {
              const error = { type: 'encoded:error', error: 'UNKNOWN_FEED', ...{ key: key.toString('hex') } }
              // stream.write(error)
              // stream.end()
              return reject(error)
            }
            try {
              await storeEncoded({
                account,
                key,
                index,
                proof: Buffer.from(proof),
                encoded: Buffer.from(encoded),
                nodes,
                signature: Buffer.from(signature)
              })
              // console.log('Received', index)
              log2attestor({ type: 'hoster', data: [`Hoster received & stored index: ${index} (${counter}/${expectedChunkCount}`] })
              resolve({ type: 'encoded:stored', ok: true, index: data.index })
            } catch (e) {
              // Uncomment for better stack traces
              const error = { type: 'encoded:error', error: `ERROR_STORING: ${e.message}`, ...{ e }, data }
              log2attestor({ type: 'error', data: [`Error: ${JSON.stringify(error)}`] })
              // beam1.destroy()
              return reject(error)
            }
          } else {
            log2attestor({ type: 'error', data: [`UNKNOWN_MESSAGE messageType: ${type}`] })
            const error ={ type: 'encoded:error', error: 'UNKNOWN_MESSAGE', ...{ messageType: type } }
            // beam1.destroy()
            return reject(error)
          }
        })
  
        async function is_valid_data (data) {
          const { feed, index, encoded, proof, nodes, signature } = data
          return !!(feed && index && encoded && proof && nodes && signature)
        }
      }
    }
  })
}

async function removeFeed (account, key, log) {
  log({ type: 'hoster', data: [`Removing the feed`] })
  const stringKey = key.toString('hex')
  if (account.storages.has(stringKey)) {
    const storage = await getStorage(account, key, log)
    await storage.destroy()
    account.storages.delete(stringKey)
  }
  await removeKey(key)
}

async function loadFeedData (account, ranges, key, log) {
  const stringKey = key.toString('hex')
  const deferred = defer()
  // If we're already loading this feed, queue up our promise after the current one
  if (account.loaderCache.has(stringKey)) {
    // Get the existing promise for the loader
    const existing = account.loaderCache.get(stringKey)
    // Create a new promise that will resolve after the previous one and
    account.loaderCache.set(stringKey, existing.then(() => deferred.promise))
    // Wait for the existing loader to resolve
    await existing
  } else {
    // If the feed isn't already being loaded, set this as the current loader
    account.loaderCache.set(stringKey, deferred.promise)
  }
  try {
    const storage = await getStorage(account, key)
    const { feed } = storage
    ranges.forEach(async (range) => {
      for (let index = range[0], len = range[1] + 1; index < len; index++) {
         await feed.download({ start: index, end: index+1 })
      }
    })
    // if (watch) watchFeed(account, feed)
    account.loaderCache.delete(stringKey)
    deferred.resolve()
  } catch (e) {
    account.loaderCache.delete(stringKey)
    deferred.reject(e)
  }
}

async function watchFeed (account, feed) {
  warn('Watching is not supported since we cannot ask the chain for attestors')
  /* const stringKey = feed.key.toString('hex')
  if (account.watchingFeeds.has(stringKey)) return
  account.watchingFeeds.add(stringKey)
  feed.on('update', onUpdate)
  async function onUpdate () {
    await loadFeedData(feed.key, ...)
  } */
}

async function storeEncoded ({ account, key, index, proof, encoded, nodes, signature }) {
  const storage = await getStorage(account, key)
  return storage.storeEncoded(index, proof, encoded, nodes, signature)
}

async function getStorageChallenge (account, key, index) {
  const storage = await getStorage(account, key)
  // const _db = storage.db
  // console.log({_db})
  const data = await storage.getStorageChallenge(index)
  return data
}

async function getStorage (account, key, log) {
  const stringKey = key.toString('hex')
  if (account.storages.has(stringKey)) {
    return account.storages.get(stringKey)
  }

  const feed = new hypercore(RAM, key, { valueEncoding: 'utf-8', sparse: true })
  await ready(feed)
  const swarm = hyperswarm()
  swarm.join(feed.discoveryKey,  { announce: false, lookup: true })
  swarm.on('connection', (socket, info) => {
    socket.pipe(feed.replicate(info.client)).pipe(socket)
  })

  const db = sub(account.db, stringKey, { valueEncoding: 'binary' })
  const storage = new HosterStorage({ db, feed, log })
  account.storages.set(stringKey, storage)
  return storage
}

async function saveKeys (account, keys) {
  await account.hosterDB.put('all_keys', keys)
}

async function addKey (account, key, options) {
  const stringKey = key.toString('hex')
  const existing = (await account.hosterDB.get('all_keys').catch(e => {})) || []
  const data = { key: stringKey, options }
  const final = existing.concat(data)
  await saveKeys(account, final)
}

async function removeKey (account, key) {
  log({ type: 'hoster', data: [`Removing the key`] })
  const stringKey = key.toString('hex')
  const existing = (await account.hosterDB.get('all_keys').catch(e => {})) || []
  const final = existing.filter((data) => data.key !== stringKey)
  await saveKeys(account, final)
  log({ type: 'hoster', data: [`Key removed`] })
}

async function close () {
  // Close the DB and hypercores
  for (const storage of account.storages.values()) {
    await storage.close()
  }
}
    
/* ------------------------------------------- 
    2. CHALLENGES
-------------------------------------------- */
    
async function send_storage_proofs_to_attestor ({ account, storageChallenge, hosterKey, feedKey, attestorKey, log }) {
  const sent_chunks = {}
  return new Promise(async (resolve, reject) => {
    const log2attestor4Challenge = log.sub(`<-Attestor4challenge ${attestorKey.toString('hex').substring(0,5)}`)
    const { id, chunks } = storageChallenge
    const topic = derive_topic({ senderKey: hosterKey, feedKey, receiverKey: attestorKey, id })
    const tid = setTimeout(() => {
      // beam.destroy()
      reject({ type: `attestor_timeout` })
    }, DEFAULT_TIMEOUT)

    const beam = new Hyperbeam(topic)
    beam.on('error', err => { 
      console.log({err})
      clearTimeout(tid)
      // beam.destroy()
      if (beam_once) {
        // beam_once.destroy()
        reject({ type: `attestor_connection_fail`, data: err })
      }
    })
    const core = toPromises(new hypercore(RAM, { valueEncoding: 'utf-8' }))
    await core.ready()
    core.on('error', err => {
      Object.values(chunks).forEach(({ reject }) => reject(err))
    })
    const coreStream = core.replicate(true, { live: true, ack: true })
    coreStream.pipe(beam).pipe(coreStream)
    coreStream.on('ack', ack => {
      const index = ack.start
      const resolve = sent_chunks[index].resolve
      delete sent_chunks[index]
      resolve('attestor received storage proofs')
    })

    // send signed event as an extension message
    ext = core.registerExtension(`challenge${id}`, { encoding: 'binary '})
    const dataBuf = sign_event(id)
    ext.broadcast(dataBuf)

    const once_topic = topic + 'once'
    var beam_once = new Hyperbeam(once_topic)
    beam_once.on('error', err => {
      clearTimeout(tid)
      // beam_once.destroy()
      // beam.destroy()
      reject({ type: `hoster_connection_fail`, data: err })
    })
    beam_once.write(JSON.stringify({ type: 'feedkey', feedkey: core.key.toString('hex')}))

    const all = []
    for (var i = 0; i < chunks.length; i++) {
      const index = chunks[i]
      const storageChallengeID = id
      const data = await getStorageChallenge(account, feedKey, index) 
      if (!data) return
      const message = { type: 'proof', storageChallengeID, data }
      log2attestor4Challenge({ type: 'hoster', data: [`Storage proof: appending chunk ${i} for index ${index}`] })
      all.push(send(message, i))
    }
    function sign_event (id) {
      const data = Buffer.from(`${id}`, 'utf-8')
      return account.sign(data)
    }
    function send (message, i) {
      return new Promise(async (resolve, reject) => {
        await core.append(JSON.stringify(message))
        sent_chunks[i] = { resolve, reject }
      })
    }
    try {
      const results = await Promise.all(all).catch((error) => {
        console.log({error})
        log2attestor4Challenge({ type: 'error', data: [`error: ${error}`] })
        clearTimeout(tid)
        // beam_once.destroy()
        // beam.destroy()
        reject({ type: `hoster_proof_fail`, data: error })
      })
      if (!results) log2attestor4Challenge({ type: 'error', data: [`No results`] })
      console.log({results})
      log2attestor4Challenge({ type: 'hoster', data: [`${all.length} responses received from the attestor`] })
      log2attestor4Challenge({ type: 'hoster', data: [`Destroying communication with the attestor`] })
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
  })
}
  