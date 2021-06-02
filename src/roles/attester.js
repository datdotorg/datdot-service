const tempDB = require('../tempdb')
const datdot_crypto = require('datdot-crypto')
const varint = require('varint')
const hypercore = require('hypercore')
const RAM = require('random-access-memory')
const { toPromises } = require('hypercore-promisifier')
const Hyperbeam = require('hyperbeam')
const derive_topic = require('derive-topic')
const proof_codec = require('datdot-codec/proof')
const getRangesCount = require('getRangesCount')
const ready = require('hypercore-ready')
const { performance } = require('perf_hooks')
const compare_encodings = require('compare-encodings')
const get_max_index = require('get-max-index')
const DEFAULT_TIMEOUT = 7500

/******************************************************************************
  ROLE: Attestor
******************************************************************************/

module.exports = attester

async function attester (identity, log, APIS) {
  const { chainAPI, vaultAPI } = APIS
  const { myAddress, signer, noiseKey: attestorKey } = identity
  log({ type: 'attestor', data: [`Listening to events for attestor role`] })
  const jobsDB = await tempDB(attestorKey)
  
  chainAPI.listenToEvents(handleEvent)

/* ----------------------------------------------------------------------
                            EVENTS
---------------------------------------------------------------------- */

  async function handleEvent (event) {
    if (event.method === 'UnpublishPlan') {
      const [planID] = event.data
      const jobIDs = unpublishedPlan_jobIDs(planID)
      jobIDs.forEach(jobID => {
        const job = jobsDB.get(jobID)
        if (job) { /* TODO: ... */ }
      })
    }
    if (event.method === 'DropHosting') {
      attestorAddress
      const [planID] = event.data
      const jobIDs = unpublishedPlan_jobIDs(planID)
      jobIDs.forEach(jobID => {
        const job = jobsDB.get(jobID)
        if (job) { /* TODO: ... */ }
      })
    }
    if (event.method === 'NewAmendment') {
      const [amendmentID] = event.data
      const amendment = await chainAPI.getAmendmentByID(amendmentID)
      const contract = await chainAPI.getContractByID(amendment.contract)
      const [attestorID] = amendment.providers.attestors
      const attestorAddress = await chainAPI.getUserAddress(attestorID)
      if (attestorAddress !== myAddress) return
      log({ type: 'chainEvent', data: [`Attestor ${attestorID}: Event received: ${event.method} ${event.data.toString()}`] })
      const { feedKey, encoderKeys, hosterKeys, ranges } = await getData(amendment, contract)
      const data = { account: vaultAPI, hosterKeys, attestorKey, feedKey, encoderKeys, amendmentID, ranges, log }
      
      const { failedKeys } = await attest_hosting_setup(data).catch((error) => log({ type: 'error', data: [`Error: ${error}`] }))
      log({ type: 'attestor', data: [`Resolved all the responses for amendment: ${amendmentID}: ${failedKeys}`] })  
      const failed = []
      for (var i = 0, len = failedKeys.length; i < len; i++) {  // TODO error: can't read property length of undefined (failedKeys)
        const id = await chainAPI.getUserIDByNoiseKey(failedKeys[i])
        failedKeys.push(id)
      }
      const report = { id: amendmentID, failed }
      const nonce = await vaultAPI.getNonce()
      await chainAPI.amendmentReport({ report, signer, nonce })
    }

    if (event.method === 'NewStorageChallenge') {
      const [storageChallengeID] = event.data
      const storageChallenge = await chainAPI.getStorageChallengeByID(storageChallengeID)
      const attestorID = storageChallenge.attestor
      const attestorAddress = await chainAPI.getUserAddress(attestorID)
      if (attestorAddress === myAddress) {
        log({ type: 'chainEvent', data: [`Attestor ${attestorID}:  Event received: ${event.method} ${event.data.toString()}`] })
        const data = await get_storage_challenge_data(storageChallenge)
        data.attestorKey = attestorKey
        data.log = log
        
        const reports = await attest_storage_challenge(data).catch((error) => {
          console.log({error})
          log({ type: 'error', data: [`Error: ${error}`] })
        })
        if (reports) {
          const response = { storageChallengeID, reports }
          const nonce = await vaultAPI.getNonce()
          const opts = { response, signer, nonce }
          log({ type: 'attestor', data: [`Submitting storage challenge`] })
          await chainAPI.submitStorageChallenge(opts)
        }
      }
    }
    if (event.method === 'NewPerformanceChallenge') {
      const [performanceChallengeID] = event.data
      const performanceChallenge = await chainAPI.getPerformanceChallengeByID(performanceChallengeID)
      const attestors = performanceChallenge.attestors
      attestors.forEach(async (attestorID) => {
        const attestorAddress = await chainAPI.getUserAddress(attestorID)
        if (attestorAddress === myAddress) {
          log({ type: 'chainEvent', data: [`Attestor ${attestorID}:  Event received: ${event.method} ${event.data.toString()}`] })
          const contractID = performanceChallenge.contract
          const contract = await chainAPI.getContractByID(contractID)
          const feedID = contract.feed
          const feedKey = await chainAPI.getFeedKey(feedID)
          const ranges = contract.ranges
          const randomChunks = ranges.map(range => getRandomInt(range[0], range[1] + 1))
          // TODO: meet with other attestors in the swarm to decide on random number of attestors
          //  sign random number
          //  add time of execution for each attestor
          //  select a reporter
          // const meeting = await meetAttestors(feedKey)
          const report = await Promise.all(randomChunks.map(async (chunk) => {
            return await attest_performance(feedKey, chunk, log)
          }))
          const nonce = await vaultAPI.getNonce()
          log({ type: 'attestor', data: [`Submitting performance challenge`] })
          await chainAPI.submitPerformanceChallenge({ performanceChallengeID, report, signer, nonce })
        }
      })
    }
  }
  // HELPERS

  async function get_storage_challenge_data (storageChallenge) {
    const hosterID = storageChallenge.hoster
    const hosterSigningKey = await chainAPI.getSigningKey(hosterID)
    const hosterKey = await chainAPI.getHosterKey(hosterID)

    const { feed: feedID, amendments, ranges } = await chainAPI.getContractByID(storageChallenge.contract)
    const amendmentID = amendments[amendments.length - 1]
    const [encoderID, pos] = await getEncoderID(amendments, hosterID)
    const encoderSigningKey = await chainAPI.getSigningKey(encoderID)
    const { feedkey: feedKey, signatures } = await chainAPI.getFeedByID(feedID)
    return { hosterKey, feedKey, signatures, ranges, amendmentID, encoder_pos: pos, hosterSigningKey, encoderSigningKey, storageChallenge }
  }

  async function getEncoderID (amendments, hosterID) {
    const amendment_id = amendments[amendments.length-1]
    const active_amendment = await chainAPI.getAmendmentByID(amendment_id)
    const pos =  active_amendment.providers.hosters.indexOf(hosterID)
    const encoderID = active_amendment.providers.encoders[pos]
    return [encoderID, pos]
  }

  async function getData (amendment, contract) {
    const { encoders, hosters } = amendment.providers
    const encoderKeys = []
    encoders.forEach(async (id) => {
      const key = await chainAPI.getEncoderKey(id)
      encoderKeys.push(key)
    })
    const hosterKeys = []
    hosters.forEach(async (id) => {
      const key = await chainAPI.getHosterKey(id)
      hosterKeys.push(key)
    })
    const feedID = contract.feed
    const feedKey = await chainAPI.getFeedKey(feedID)
    const ranges = contract.ranges
    return { feedKey, encoderKeys, hosterKeys, ranges }
  }

  function getRandomInt (min, max) {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min)) + min // The maximum is exclusive and the minimum is inclusive
  }
}

/* ----------------------------------------------------------------------
                            HOSTING SETUP
---------------------------------------------------------------------- */

async function attest_hosting_setup (data) {
  const { amendmentID, feedKey, hosterKeys, attestorKey, encoderKeys, ranges, log } = data
  const messages = {}
  const responses = []
  for (var i = 0, len = encoderKeys.length; i < len; i++) {
    const encoderKey = encoderKeys[i]
    const hosterKey = hosterKeys[i]
    const opts = { log, amendmentID, attestorKey, encoderKey, hosterKey, ranges, feedKey }
    opts.compare_encodings_CB = (msg, key) => compare_encodings({ messages, key, msg, log })
    log({ type: 'attestor', data: [`Verify encodings!`] })
    responses.push(verify_and_forward_encodings(opts))
  }
  const failed = await Promise.all(responses) // can be 0 to 6 pubKeys of failed providers
  const failed_flat = failed.flat()
  const failedKeys =  [...new Set(failed_flat)]
  const report = { failedKeys }
  return report
  
  async function verify_and_forward_encodings (opts) {
    const { log, amendmentID, attestorKey, encoderKey, hosterKey, feedKey, ranges, compare_encodings_CB } = opts
    const topic_encoder = derive_topic({ senderKey: encoderKey, feedKey, receiverKey: attestorKey, id: amendmentID })
    const topic_hoster = derive_topic({ senderKey: attestorKey, feedKey, receiverKey: hosterKey, id: amendmentID })
    const expectedChunkCount = getRangesCount(ranges)
    const failedKeys = []
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
        failedKeys.push(encoderKey)
      }
      else if (err.type === 'hoster_connection_fail') {
        failedKeys.push(hosterKey)
        hoster_failed = true
        try {
          await encoder_channel('HEAR', handler)
        } catch (err) {
          if (err.type === 'encoder_connection_fail') failedKeys.push(encoderKey)
          else console.log(err)
        }
      }
      else if (err.type === 'encoder_timeout') failedKeys.push(encoderKey)
      else console.log(err)
    }
    return failedKeys
  
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
          log({type: 'attestor', data: [`before comparing CB, ${STATUS}`]})
          await compare_encodings_CB(chunk, encoderKey)
          log({type: 'attestor', data: [`after comparing CB, ${STATUS}`]})
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
        }
        // return 'NEXT'
      } catch (err) {
        log({type: 'attestor', data: [`ERROR, ${err}`]})
        pending--
        if (STATUS === 'END') {
          if (!pending) hoster_channel('QUIT')
          return
        }
        else if (err.type === 'invalid_encoding' && !encoder_failed) {
          encoder_failed = true
          hoster_channel('QUIT')
          failedKeys.push(encoderKey)
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
          failedKeys.push(hosterKey)
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
              const clone = toPromises(new hypercore(RAM, feedKey, { valueEncoding: 'binary', sparse: true }))
              core = clone
              const cloneStream = clone.replicate(false, { live: true })
              cloneStream.pipe(beam).pipe(cloneStream)
              // beam_once.destroy()
              // beam_once = undefined
              resolve(channel)
            }
          })
        } else {
          core = toPromises(new hypercore(RAM, { valueEncoding: 'binary' }))
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
            // delete chunks[index]
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
              log({ type: 'attestor', data: [`Got a message from encoder`] })
              const message = await data
              log({ type: 'attestor', data: [`Awaited a message`] })
              const messageObj = JSON.parse(message)
              const parsed_message = proof_codec.encode(messageObj)
              log({ type: 'attestor', data: [`Appending new message for hoster in hosting setup`] })
              const id = await core.append(parsed_message)
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
              resolve(failedKeys)
            })
          }
        }
      })
    }
  }
}


/* ----------------------------------------------------------------------
                        VERIFY STORAGE CHALLENGE
---------------------------------------------------------------------- */
async function attest_storage_challenge (data) {
  return new Promise(async (resolve, reject) => {
    const { storageChallenge, attestorKey, hosterSigningKey, hosterKey, feedKey, signatures, ranges, amendmentID, encoder_pos, encoderSigningKey, log } = data
    const {id , chunks } = storageChallenge
    const log2hosterChallenge = log.sub(`<-HosterChallenge ${hosterKey.toString('hex').substring(0,5)}`)
    log2hosterChallenge({ type: 'attestor', data: [`Starting attest_storage_challenge}`] })
    
    const topic = derive_topic({ senderKey: hosterKey, feedKey, receiverKey: attestorKey, id })
    const tid = setTimeout(() => {
      // beam.destroy()
      console.log('timeout')
      reject({ type: `attestor_timeout` })
    }, DEFAULT_TIMEOUT)

    const beam = new Hyperbeam(topic)
    beam.on('error', err => { 
      clearTimeout(tid)
      // beam.destroy()
      if (beam_once) {
        // beam_once.destroy()
        console.log('beam error', {err})
        reject({ type: `attestor_connection_fail`, data: err })
      }
    })
    const once_topic = topic + 'once'
    var beam_once = new Hyperbeam(once_topic)
    beam_once.on('error', err => { 
      clearTimeout(tid)
      // beam_once.destroy()
      // beam.destroy()
      console.log('beam once error', {err})
      reject({ type: `${role}_connection_fail`, data: err })
    })
    const all = []
    let core
    beam_once.once('data', async (data) => {
      const message = JSON.parse(data)
      if (message.type === 'feedkey') {
        const feedKey = Buffer.from(message.feedkey, 'hex')
        const clone = toPromises(new hypercore(RAM, feedKey, { valueEncoding: 'binary', sparse: true }))
        core = clone
        const cloneStream = clone.replicate(false, { live: true })
        cloneStream.pipe(beam).pipe(cloneStream)
        // beam_once.destroy()
        // beam_once = undefined
        get_data(core)
      }
    })

    async function get_data (core) {
        // get chunks from hoster
      for (var i = 0, len = chunks.length; i < len; i++) {
        const data_promise = core.get(i)
        all.push(verify_chunk(data_promise))
      }
      try {
        const results = await Promise.all(all).catch(err => { console.log(err) })
        if (!results) log2hosterChallenge({ type: 'error', data: [`No results`] })
        // get signed event as an extension message
        clearTimeout(tid)
        ext = core.registerExtension(`challenge${id}`, { 
          encoding: 'binary',
          async onmessage (storage_challenge_signature) {
            const messageBuf = Buffer.alloc(varint.encodingLength(id))
            varint.encode(id, messageBuf, 0)
            if (!datdot_crypto.verify_signature(storage_challenge_signature, messageBuf, hosterSigningKey)) {
              console.log('not a valid event')
              reject(storage_challenge_signature)
            }
            results.forEach(result => result.storage_challenge_signature = storage_challenge_signature)
            // beam.destroy()
            resolve(results)
          },
          onerror (err) {
            console.log('err')
            reject(err)
          }
        })
      } catch (err) {
        console.log('results error', {err})
        log2hosterChallenge({ type: 'error', data: [`Error: ${err}`] })
        clearTimeout(tid)
        // beam.destroy()
        reject({ type: `hoster_proof_fail`, data: err })
      }
    }

    // @NOTE:
    // attestor receives: encoded data, nodes + encoded_data_signature
    // attestor verifies signed event
    // attestor verifies if chunk is signed by the original encoder (signature, encoder's pubkey, encoded chunk)
    // attestor decompresses the chunk and takes out the original data (arr[1])
    // attestor merkle verifies the data: (feedkey, root signature from the chain (published by attestor after published plan)  )
    // attestor sends to the chain: nodes, signature, hash of the data & signed event

    function verify_chunk (chunk_promise) {
      return new Promise(async (resolve, reject) => {
        const chunk = await chunk_promise
        const json = chunk.toString('binary')
        const data = proof_codec.decode(json)
        const { index, encoded_data, encoded_data_signature, nodes } = data
        log2hosterChallenge({ type: 'attestor', data: [`Storage proof received, ${index}`]})
        
        if (!datdot_crypto.verify_signature(encoded_data_signature, encoded_data, encoderSigningKey)) reject(index)
        const unique_el = `${amendmentID}/${encoder_pos}`
        await datdot_crypto.verify_chunk_hash(index, encoded_data, unique_el, nodes).catch(err => reject('not valid chunk hash', err))

        const keys = Object.keys(signatures)
        const indexes = keys.map(key => Number(key))
        const max = get_max_index(ranges)
        const version = indexes.find(v => v >= max)
        const not_verified = datdot_crypto.merkle_verify({feedKey, hash_index: index * 2, version, signature: Buffer.from(signatures[version], 'binary'), nodes})
        if (not_verified) reject(is_verified)
        log2hosterChallenge({ type: 'attestor', data: [`Storage verified for ${index}`]})
        resolve({version, nodes })
      })
    }

  })
}

/* ----------------------------------------------------------------------
                        CHECK PERFORMANCE
---------------------------------------------------------------------- */

async function attest_performance (key, index, log) { // key = feedkey, index = chunk index
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