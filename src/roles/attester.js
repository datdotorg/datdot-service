const tempDB = require('../tempdb')
const crypto = require('datdot-crypto')
const hypercore = require('hypercore')
const RAM = require('random-access-memory')
const { toPromises } = require('hypercore-promisifier')
const Hyperbeam = require('hyperbeam')
const derive_topic = require('derive_topic')
const getRangesCount = require('getRangesCount')
const ready = require('hypercore-ready')
const { performance } = require('perf_hooks')
const EncoderDecoder = require('EncoderDecoder')
const compare_encodings = require('compare-encodings')
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

  // EVENTS
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
      const failedKeys = await attest_hosting_setup(data).catch((error) => log({ type: 'error', data: [`Error: ${error}`] }))
      log({ type: 'attestor', data: [`Resolved all the responses for amendment: ${amendmentID}: ${failedKeys}`] })  
      const failed = []
      for (var i = 0, len = failedKeys.length; i < len; i++) {
        const id = await chainAPI.getUserIDByNoiseKey(failedKeys[i])
        failed.push(id)
      }
      const report = { id: amendmentID, failed }
      const encoders = amendment.encoders
      const nonce = await vaultAPI.getNonce()
      await chainAPI.amendmentReport({ report, signer, nonce })
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
    if (event.method === 'NewStorageChallenge') {
      const [storageChallengeID] = event.data
      const storageChallenge = await chainAPI.getStorageChallengeByID(storageChallengeID)
      const attestorID = storageChallenge.attestor
      const attestorAddress = await chainAPI.getUserAddress(attestorID)
      if (attestorAddress === myAddress) {
        log({ type: 'chainEvent', data: [`Attestor ${attestorID}:  Event received: ${event.method} ${event.data.toString()}`] })
        const data = await getStorageChallengeData(storageChallenge)
        data.account = vaultAPI
        data.attestorKey = attestorKey
        data.log = log
        const proofs = await attest_storage_challenge(data).catch((error) => log({ type: 'error', data: [`Error: ${error}`] }))
        log({ type: 'attestor', data: [`Got all the proofs`] })
        if (proofs) {
          const response = makeResponse({ proofs, storageChallengeID})
          const nonce = await vaultAPI.getNonce()
          const opts = { response, signer, nonce }
          log({ type: 'attestor', data: [`Submitting storage challenge`] })
          await chainAPI.submitStorageChallenge(opts)
        }
      }
    }
  }
  // HELPERS
  function makeResponse ({ proofs, storageChallengeID}) {
    const signature = 'foobar' // we will get the signature from the message
    const response = { storageChallengeID, signature }
    for (var i = 0, len = proofs.length; i < len; i++) {
      response.hashes = []
      const proof = proofs[i]
      const hash = proof // TODO later hash the proof
      response.hashes.push(hash)
      // does hoster send a hash or does attestor decode and then hash?
    }
    // return hash, challengeID, signature of the event
    return response
  }
  async function getStorageChallengeData (storageChallenge) {
    const hosterID = storageChallenge.hoster
    const hosterSigningKey = await chainAPI.getSigningKey(hosterID)
    const hosterKey = await chainAPI.getHosterKey(hosterID)
    const contract = await chainAPI.getContractByID(storageChallenge.contract)
    const feedID = contract.feed
    const feedKey = await chainAPI.getFeedKey(feedID)
    return { hosterKey, feedKey, hosterSigningKey, storageChallenge }
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
    const opts = { log, amendmentID, attestorKey, encoderKey, hosterKey, ranges, feedKey, compareCB: (msg, key) => compare_encodings({ messages, key, msg, log }) }
    log({ type: 'attestor', data: [`Verify encodings!`] })
    responses.push(verify_and_forward_encodings(opts))
  }
  const failedKeys = await Promise.all(responses) // can be 0 to 6 pubKeys of failed providers
  return failedKeys.flat()
}

async function verify_and_forward_encodings (opts) {
  const { log, amendmentID, attestorKey, encoderKey, hosterKey, feedKey, ranges, compareCB } = opts
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
    const { storageChallenge, attestorKey, hosterSigningKey, hosterKey, feedKey, log } = data
    const {id, chunks } = storageChallenge
    const log2hosterChallenge = log.sub(`<-HosterChallenge ${hosterKey.toString('hex').substring(0,5)}`)
    log({ type: 'log2hosterChallenge', data: [`Starting attest_storage_challenge}`] })

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
        encoding: 'binary',
        async onmessage (signed_event) {
          if (!is_valid_event(signed_event, `${id}`, hosterSigningKey)) reject(signed_event)
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

    function is_valid_event (signature, message, hosterSigningKey) {
      console.log('verifying signature')
      const messageBuf = Buffer.from(message, 'binary')
      return crypto.verify_signature(signature, messageBuf, hosterSigningKey)
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