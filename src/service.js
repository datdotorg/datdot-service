const varint = require('varint')
const hypercore = require('hypercore')
const RAM = require('random-access-memory')
const { toPromises } = require('hypercore-promisifier')
const Hyperbeam = require('hyperbeam')
const derive_topic = require('derive_topic')
const getRangesCount = require('getRangesCount')
const hyperswarm = require('hyperswarm')
const ready = require('hypercore-ready')
const get_signature = require('get-signature')
const get_nodes = require('get-nodes')
const get_index = require('get-index')
const download_range = require('download-range')
const verify_signature = require('verify-signature')
const { performance } = require('perf_hooks')
const EncoderDecoder = require('EncoderDecoder')
const sub = require('subleveldown')
const defer = require('promise-defer')
const audit = require('audit-hypercore')
const HosterStorage = require('./hoster-storage')
const DEFAULT_TIMEOUT = 7500

module.exports = service

function service (log) {
  return {
    // encoder
    encode_hosting_setup, 
    // attestor
    verify_and_forward_encodings,
    attest_storage_challenge,
    attest_performance,
    // hoster
    receive_data_and_start_hosting,
    send_storage_proofs_to_attestor,
  }
    /* -----------------------------------------------------------------------------------------------------------------------------
    
                                                        ENCODER

    ----------------------------------------------------------------------------------------------------------------------------- */

async function encode_hosting_setup ({ account, amendmentID, attestorKey, encoderKey, feedKeyBuffer: feedKey, ranges }) {
  const log2Attestor = log.sub(`->Attestor ${attestorKey.toString('hex').substring(0,5)}`)
  const expectedChunkCount = getRangesCount(ranges)
  let stats = {
    ackCount: 0
  }
  return new Promise(async (resolve, reject) => {
    if (!Array.isArray(ranges)) ranges = [[ranges, ranges]]
    const feed = new hypercore(RAM, feedKey, { valueEncoding: 'utf-8', sparse: true })
    await ready(feed)
    const swarm = hyperswarm()
    swarm.join(feed.discoveryKey,  { announce: false, lookup: true })
    swarm.on('connection', (socket, info) => {
      socket.pipe(feed.replicate(info.client)).pipe(socket)  // TODO: sparse replication and download only chunks we need, do not replicate whole feed
    })

    // @NOTE:
    // sponsor provides only feedkey and swarmkey (no metadata)
    // when chain makes contracts, it checks if there is a signature for highest index of the contract
    // if not, it emits signature: true (only when signature is needed)
    // if (signature)
      // encoders in this contract get the signature for the highest index and send it to attestor
      // attestor compares the signatures and nodes and if they match, it sends them to the chain with the report

    // create temp hypercore
    const core = toPromises(new hypercore(RAM, { valueEncoding: 'utf-8' }))
    await core.ready()
   
    // connect to attestor
    const topic = derive_topic({ senderKey: encoderKey, feedKey, receiverKey: attestorKey, id: amendmentID })
    const beam = new Hyperbeam(topic)
    
    // send the key
    const temp_topic = topic + 'once'
    const beam_temp = new Hyperbeam(temp_topic)
    beam_temp.write(JSON.stringify({ type: 'feedkey', feedkey: core.key.toString('hex')}))
    
    // pipe streams
    const coreStream = core.replicate(true, { live: true, ack: true })
    coreStream.pipe(beam).pipe(coreStream)
    coreStream.on('ack', ack => {
      log2Attestor({ type: 'encoder', data: [`ACK from attestor: chunk received`] })
      stats.ackCount++
    })

    start(core)
    
    async function start (core) {
      var total = 0
      for (const range of ranges) total += (range[1] + 1) - range[0]
      log2Attestor({ type: 'encoder', data: [`Start encoding and sending data to attestor`] })
      for (const range of ranges) sendDataToAttestor({ account, core, range, feed, feedKey, beam, log: log2Attestor, stats, expectedChunkCount })
    }
  })
}
async function sendDataToAttestor ({ account, core, range, feed, feedKey, beam, log, stats, expectedChunkCount }) {
  for (let index = range[0], len = range[1] + 1; index < len; index++) {
    const msg = encode(account, index, feed, feedKey)
    send({ msg, core, log, stats, expectedChunkCount })
  }
}
async function send ({ msg, core, log, stats, expectedChunkCount }) {
  return new Promise(async (resolve, reject) => {
    const message = await msg
    await core.append(JSON.stringify(message))
    log({ type: 'encoder', data: [`MSG appended ${message.index}`]})
    if (stats.ackCount === expectedChunkCount) resolve(`Encoded ${message.index} sent`)
  })
}
async function encode (account, index, feed, feedKey) {
  await download_range(feed, { start: index, end: index+1 })
  const data = await get_index(feed, index)  
  const encoded = await EncoderDecoder.encode(data)
  const nodes = await get_nodes(feed, index)
  const signature = await get_signature(feed, index)
    
  // Allocate buffer for the data that should be signed
  const toSign = Buffer.alloc(encoded.length + varint.encodingLength(index))
  // Write the index to the buffer that will be signed
  varint.encode(index, toSign, 0)
  // Copy the encoded data into the buffer that will be signed
  encoded.copy(toSign, varint.encode.bytes)
  const proof = account.sign(toSign)
  return { type: 'encoded', feed: feedKey, index, encoded, proof, nodes, signature }

}

// @NOTE:
// 1. encoded chunk has to be unique ([pos of encoder in the event, data]), so that hoster can not delete and download the encoded chunk from another hoster just in time
// 2. encoded chunk has to be signed by the original encoder so that the hoster cannot encode a chunk themselves and send it to attester
// 3. attestor verifies unique encoding data was signed by original encoder

/* -----------------------------------------------------------------------------------------------------------------------------
    
                                                        HOSTER

----------------------------------------------------------------------------------------------------------------------------- */

  
/* ------------------------------------------- 
      1. GET ENCODED AND START HOSTING
-------------------------------------------- */

async function receive_data_and_start_hosting ({ account, amendmentID, feedKey, hosterKey, attestorKey, plan, ranges, log }) {
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
    const storage = await getStorage(account, key)
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
    await loadFeedData(feed.key)
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

async function getStorage (account, key) {
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
    ext = core.registerExtension(`challenge${id}`, { encoding: 'utf-8 '})
    ext.broadcast(get_signed_event(id))

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
    function get_signed_event (storageChallengeID) {
      const data = Buffer.from(storageChallengeID.toString(), 'hex')
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
  

    /* -----------------------------------------------------------------------------------------------------------------------------
    
                                                        ATTESTOR

    ----------------------------------------------------------------------------------------------------------------------------- */


/* ----------------------------------------------------------------------
                            HOSTING SETUP
---------------------------------------------------------------------- */
async function verify_and_forward_encodings (opts) {
  const { amendmentID, attestorKey, encoderKey, hosterKey, feedKey, ranges, compareCB } = opts
  const topic_encoder = derive_topic({ senderKey: encoderKey, feedKey, receiverKey: attestorKey, id: amendmentID })
  const topic_hoster = derive_topic({ senderKey: attestorKey, feedKey, receiverKey: hosterKey, id: amendmentID })
  const expectedChunkCount = getRangesCount(ranges)
  const report = []
  let STATUS
  let hoster_failed
  let encoder_failed
  let encoder_channel
  let hoster_channel
  var pending = 0
  try {
    encoder_channel = await connect_to('encoder', true, topic_encoder, expectedChunkCount)
    hoster_channel = await connect_to('hoster', false, topic_hoster, expectedChunkCount)
    await encoder_channel('HEAR', handler)
  } catch (err) {
    if (err.type === 'encoder_connection_fail') {
      if (hoster_channel) hoster_channel('QUIT')
      report.push(encoderKey)
    }
    else if (err.type === 'hoster_connection_fail') {
      report.push(hosterKey)
      hoster_failed = true
      try {
        await encoder_channel('HEAR', handler)
      } catch (err) {
        if (err.type === 'encoder_connection_fail') report.push(encoderKey)
        else console.log(err)
      }
    }
    else if (err.type === 'encoder_timeout') report.push(encoderKey)
    else console.log(err)
  }
  return report

  async function handler (type, chunk) {      
    try {
      if (type === 'FAIL') {
        STATUS = 'FAILED'
        hoster_channel('QUIT')
        return
      }
      if (type === 'DONE') {
        STATUS = 'END'
        if (!pending) hoster_channel('QUIT')
        return
      }
      if (type === 'DATA') {
        pending++
        await compareCB(chunk, encoderKey) // TODO: REFACTOR to promise and throw invalid_encoding or other_encoder_failed  
        if (STATUS === 'FAILED') {
          pending--
          if (!pending) hoster_channel('QUIT')
          return
        }
        await hoster_channel('SEND', chunk)
        pending--
        if (STATUS === 'END' || STATUS === 'FAILED') {
          if (!pending) hoster_channel('QUIT')
          return
        }
        console.log('return next')
      }
      // return 'NEXT'
    } catch (err) {
      pending--
      if (STATUS === 'END') {
        if (!pending) hoster_channel('QUIT')
        return
      }
      else if (err.type === 'invalid_encoding' && !encoder_failed) {
        encoder_failed = true
        hoster_channel('QUIT')
        report.push(encoderKey)
        STATUS = 'FAILED'
        return 'QUIT'
      }
      else if (err.type === 'other_encoder_failed') {
        STATUS = 'FAILED'
        hoster_channel('QUIT')
        return 'MUTE' // keep receiving chunks, but stop listening
      }
      else if (err.type === 'hoster_timeout') {
        STATUS = 'FAILED'
        hoster_failed = true
        report.push(hosterKey)
        return 'MUTE'
      }
      else console.log(err)
    }
  }

  async function connect_to (role, isSender, topic, expectedChunkCount) {
    const chunks = {}
    var beam_error
    return new Promise(async (resolve, reject) => {
      const tid = setTimeout(() => {
        // beam.destroy()
        reject({ type: `${role}_timeout` })
      }, DEFAULT_TIMEOUT)
      const beam = new Hyperbeam(topic)
      beam.on('error', err => { 
        clearTimeout(tid)
        // beam.destroy()
        if (beam_once) {
          // beam_once.destroy()
          reject({ type: `${role}_connection_fail`, data: err })
        } else beam_error = err
      })
      let core
      const once_topic = topic + 'once'
      var beam_once = new Hyperbeam(once_topic)
      beam_once.on('error', err => { 
        clearTimeout(tid)
        // beam_once.destroy()
        // beam.destroy()
        reject({ type: `${role}_connection_fail`, data: err })
      })
      if (isSender) {
        beam_once.once('data', async (data) => {
          const message = JSON.parse(data.toString('utf-8'))
          if (message.type === 'feedkey') {
            const feedKey = Buffer.from(message.feedkey, 'hex')
            const clone = toPromises(new hypercore(RAM, feedKey, { valueEncoding: 'utf-8', sparse: true }))
            core = clone
            const cloneStream = clone.replicate(false, { live: true })
            cloneStream.pipe(beam).pipe(cloneStream)
            // beam_once.destroy()
            // beam_once = undefined
            resolve(channel)
          }
        })
      } else {
        core = toPromises(new hypercore(RAM, { valueEncoding: 'utf-8' }))
        await core.ready()
        core.on('error', err => {
          Object.values(chunks).forEach(({ reject }) => reject(err))
        })
        const coreStream = core.replicate(true, { live: true, ack: true })
        coreStream.pipe(beam).pipe(coreStream)
        beam_once.write(JSON.stringify({ type: 'feedkey', feedkey: core.key.toString('hex')}))
        coreStream.on('ack', function (ack) {
          // console.log('ACK INDEX', ack.start)
          const index = ack.start
          const store = chunks[index]
          const resolve = store.resolve
          delete chunks[index]
          chunks[index] = ack
          resolve()
        })
        resolve(channel)
      }

      async function channel (type, data) {
        if (type === 'QUIT') {
          return new Promise((resolve, reject) => {
            clearTimeout(tid)
            // beam.destroy()
            resolve()
          })
        }
        else if (type === 'SEND') {
          return new Promise(async (resolve, reject) => {
            const message = await data
            const parsed = JSON.parse(message.toString('utf-8'))
            parsed.type = 'verified'
            const id = await core.append(JSON.stringify(parsed))
            chunks[id] = { resolve, reject }
            // console.log('SENT INDEX', id)
            // resolve()
          })
        }
        else if (type === 'HEAR') {
          var handlerCB = data
          var status
          var error
          return new Promise(async (resolve, reject) => {
            if (beam_error) return reject({ type: `${role}_connection_fail`, data: beam_error })
            core.on('error', err => {
              error = err
              clearTimeout(tid)
              // beam.destroy()
              reject({ type: `${role}_connection_fail`, data: err })
            })
            // get replicated data
            const chunks = []
            for (var i = 0; i < expectedChunkCount; i++) {
              if (status === 'END') return
              const chunk = core.get(i)
              if (status === 'MUTED') continue
              const promise = handlerCB('DATA', chunk)
              chunks.push(promise)
              promise.catch(err => {
                console.log('ERROR promise handlerCB', err)
                status = 'FAIL'
                clearTimeout(tid)
                // beam.destroy()
                reject({ type: `${role}_connection_fail`, data: err })
                handlerCB('FAIL', err)
              }).then(type => {
                if (status === 'END') return
                if (type === 'MUTE') return status = 'MUTED'
                if (type === 'QUIT') {
                  // beam.destroy()
                  // if (status !== 'MUTED')
                  status = 'END'
                }
              })
            }
            console.log('Sending report', expectedChunkCount, chunks.length)
            handlerCB('DONE')
            status = 'END'
            await Promise.all(chunks)
            clearTimeout(tid)
            // beam.destroy()
            resolve(report)
          })
        }
      }
    })
  }
}


/* ----------------------------------------------------------------------
                        VERIFY STORAGE CHALLENGE
---------------------------------------------------------------------- */
async function attest_storage_challenge (data) {
  return new Promise(async (resolve, reject) => {
    log({ type: 'attestor', data: [`Starting attest_storage_challenge}`] })
    const { storageChallenge, attestorKey, hosterKey, feedKey } = data
    const {id, chunks } = storageChallenge
    const log2hosterChallenge = log.sub(`<-HosterChallenge ${hosterKey.toString('hex').substring(0,5)}`)

    const topic = derive_topic({ senderKey: hosterKey, feedKey, receiverKey: attestorKey, id })

    const tid = setTimeout(() => {
      // beam.destroy()
      reject({ type: `attestor_timeout` })
    }, DEFAULT_TIMEOUT)

    const beam = new Hyperbeam(topic)
    beam.on('error', err => { 
      clearTimeout(tid)
      // beam.destroy()
      if (beam_once) {
        // beam_once.destroy()
        reject({ type: `attestor_connection_fail`, data: err })
      }
    })
    const once_topic = topic + 'once'
    var beam_once = new Hyperbeam(once_topic)
    beam_once.on('error', err => { 
      clearTimeout(tid)
      // beam_once.destroy()
      // beam.destroy()
      reject({ type: `${role}_connection_fail`, data: err })
    })
    const all = []
    let core
    beam_once.once('data', async (data) => {
      const message = JSON.parse(data.toString('utf-8'))
      if (message.type === 'feedkey') {
        const feedKey = Buffer.from(message.feedkey, 'hex')
        const clone = toPromises(new hypercore(RAM, feedKey, { valueEncoding: 'utf-8', sparse: true }))
        core = clone
        const cloneStream = clone.replicate(false, { live: true })
        cloneStream.pipe(beam).pipe(cloneStream)
        // beam_once.destroy()
        // beam_once = undefined
        get_data(core)
        resolve()
      }
    })

    async function get_data (core) {
      // get signed event as an extension message
      ext = core.registerExtension(`challenge${id}`, { 
        encoding: 'utf-8',
        async onmessage (signed_event) {
          if (!is_valid_event(signed_event)) reject(signed_event)
          // get chunks from hoster
          for (var i = 0, len = chunks.length; i < len; i++) {
            const chunk = core.get(i)
            all.push(verify_chunk(chunk, i))
          }
          try {
            const results = await Promise.all(all).catch(err => { console.log(err) })
            if (!results) log2hosterChallenge({ type: 'error', data: [`No results`] })
            console.log({results})
            clearTimeout(tid)
            // beam.destroy()
            resolve({ type: `DONE`, data: results })
          } catch (err) {
            log2hosterChallenge({ type: 'error', data: [`Error: ${err}`] })
            clearTimeout(tid)
            // beam.destroy()
            reject({ type: `hoster_proof_fail`, data: err })
          }
        },
        onerror (err) {
          console.log('err')
          reject(err)
        }
      })


    }

    // @NOTE:
    // attestor receives: encoded data, signature (proof), nodes + signed event
    // attestor verifies signed event
    // attestor verifies if chunk is signed by the original encoder (signature, encoder's pubkey, encoded chunk)
    // attestor decompresses the chunk and takes out the original data (arr[1])
    // attestor merkle verifies the data: (feedkey, root signature from the chain (published by attestor after published plan)  )
    // attestor sends to the chain: nodes, signature, hash of the data & signed event

    function verify_chunk (data_promise, i) {
      return new Promise(async (resolve, reject) => {
        const chunk = await data_promise
        const message = JSON.parse(chunk.toString('utf-8'))
        const { type, storageChallengeID, data, signed_event } = message
        log2hosterChallenge({ type: 'attestor', data: [`Storage proof received, ${data.index}`]})
        if (id !== storageChallengeID) return log2hosterChallenge({ type: 'attestor', data: [`Wrong id: ${id}`] })
        if (type === 'proof') {
          // if (await !is_merkle_verified()) reject(data)
          if (!is_valid_proof(message, feedKey, storageChallenge)) reject(data.index)
          log2hosterChallenge({ type: 'attestor', data: [`Storage verified for ${data.index}`]})
          console.log('proof verified')
          resolve(data)
        } else {
          log2hosterChallenge({ type: 'attestor', data: [`UNKNOWN_MESSAGE messageType: ${type}`] })
          reject(index)
        }
      })
    }

    function is_valid_event (sig) {
      console.log('verifying signature')
      // verify if right signature & right signed event
      return true
    }

    async function is_valid_proof (message, feedKey, storageChallenge) {
      const { data } = message
      if (!data) console.log('No data')
      const { index, encoded, proof } = data
      const decoded = await EncoderDecoder.decode(Buffer.from(encoded))
      // console.log({data})
      // hash the data
      return true
    }

  })
}

  
/* ----------------------------------------------------------------------
                        CHECK PERFORMANCE
---------------------------------------------------------------------- */

async function attest_performance (key, index) { // key = feedkey, index = chunk index
  return new Promise(async (resolve, reject) => {
    const feed = new hypercore(RAM, key, { persist: false })
    try {
      const start = performance.now()
      await Promise.race([
        feed.get(index),
        delay(DEFAULT_TIMEOUT).then(() => { throw new Error('Timed out') })
      ])
      const end = performance.now()
      const latency = end - start
      const stats = await getFeedStats(feed)
      resolve([stats, latency])
    } catch (e) {
      log(`Error: ${key}@${index} ${e.message}`)
      reject()
      return [null, null]
    } finally {
      await feed.close()
    }

    async function getFeedStats (feed) {
      if (!feed) return {}
      const stats = feed.stats
      const openedPeers = feed.peers.filter(p => p.remoteOpened)
      const networkingStats = {
        key: feed.key,
        discoveryKey: feed.discoveryKey,
        peerCount: feed.peers.length,
        peers: openedPeers.map(p => {
          return { ...p.stats, remoteAddress: p.remoteAddress }
        })
      }
      return {
        ...networkingStats,
        uploadedBytes: stats.totals.uploadedBytes,
        uploadedChunks: stats.totals.uploadedBlocks,
        downloadedBytes: stats.totals.downloadedBytes,
        downloadedChunks: feed.downloaded(),
        totalBlocks: feed.length
      }
    }
  })
}
















}