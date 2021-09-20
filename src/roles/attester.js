const { toPromises } = require('hypercore-promisifier')
const RAM = require('random-access-memory')
const derive_topic = require('derive-topic')
const hyperswarm = require('hyperswarm')
const hypercore = require('hypercore')
const Hyperbeam = require('hyperbeam')
const brotli = require('brotli')
const varint = require('varint')
const { data } = require('hypercore-crypto')

const { performance } = require('perf_hooks')

const datdot_crypto = require('datdot-crypto')
const proof_codec = require('datdot-codec/proof')

const ready = require('_datdot-service-helpers/hypercore-ready')
const hypercore_close = require('hypercore-close')
const hypercore_replicated = require('_datdot-service-helpers/hypercore-replicated')
const tempDB = require('_tempdb')
const getRangesCount = require('getRangesCount')
const compare_encodings = require('compare-encodings')
const get_max_index = require('_datdot-service-helpers/get-max-index')
const get_index = require('_datdot-service-helpers/get-index')
const download_range = require('download-range')
const { hexAddPrefix } = require('@polkadot/util')

const DEFAULT_TIMEOUT = 15000

// global variables
const organizer = {
}
/******************************************************************************
  ROLE: Attestor
******************************************************************************/

module.exports = attester

async function attester (identity, log, APIS) {
  const { swarmAPI, chainAPI, vaultAPI } = APIS
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
      log({ type: 'chainEvent', data: { text: `Attestor ${attestorID}: Event received: ${event.method} ${event.data.toString()}`, amendment: JSON.stringify(amendment)} })
      const { feedKey, encoderKeys, hosterKeys, hosterSigningKeys, ranges } = await getData(chainAPI, amendment, contract)
      const data = { account: vaultAPI, hosterKeys, hosterSigningKeys, attestorKey, feedKey, encoderKeys, amendmentID, ranges, log }
      const { failedKeys, sigs } = await attest_hosting_setup(data).catch((error) => log({ type: 'error', data: { text: 'Caught error from hosting setup (attester)', error } }))
      log({ type: 'attestor', data: { text: `Resolved all the responses for amendment`, amendmentID, failedKeys, sigs } })
      
      failedKeys.forEach(async (key) => await chainAPI.getUserIDByNoiseKey(Buffer.from(key, 'hex')))
      log({ type: 'attestor', data: { text: `Failed key user IDs`, failedKeys } })  
      const signatures = {}
      for (var i = 0, len = sigs.length; i < len; i++) {
        const { unique_el_signature, hosterKey } = sigs[i]
        const hoster_id = await chainAPI.getUserIDByNoiseKey(Buffer.from(hosterKey, 'hex'))
        signatures[hoster_id] = unique_el_signature
      }
      const report = { id: amendmentID, failed: failedKeys, signatures }
      log({ type: 'attestor', data: { text: `Report ready`, amendmentID } })  
      const nonce = await vaultAPI.getNonce()
      await chainAPI.amendmentReport({ report, signer, nonce })
      log({ type: 'attester', data: { text: 'Report sent', amendmentID } })
    }

    if (event.method === 'NewStorageChallenge') {
      const [storageChallengeID] = event.data
      const storageChallenge = await chainAPI.getStorageChallengeByID(storageChallengeID)
      const { attestor: attestorID, checks } = storageChallenge
      const attestorAddress = await chainAPI.getUserAddress(attestorID)
      if (attestorAddress !== myAddress) return
      log({ type: 'chainEvent', data: `Attestor ${attestorID}:  Event received: ${event.method} ${event.data.toString()}` })
      
      const data = await get_storage_challenge_data(storageChallenge, chainAPI)
      data.log = log
      
      const res = await attest_storage_challenge(data).catch((error) => {
        const error_msg = { type: 'fail', data: error }
        log(error_msg)
      })
      if (res) {
        const response = { storageChallengeID, storage_challenge_signature: res.storage_challenge_signature, reports: res.reports }
        const nonce = await vaultAPI.getNonce()
        const opts = { response, signer, nonce }
        const info_msg = { type: 'attestor', data: { text: `storage challenge report`, storageChallengeID,  contractIDs: [res.reports.map(x => x.contractID)] } }
        log(info_msg)
        await chainAPI.submitStorageChallenge(opts)
      }
    }
    if (event.method === 'NewPerformanceChallenge') {
      const [performanceChallengeID] = event.data
      const performanceChallenge = await chainAPI.getPerformanceChallengeByID(performanceChallengeID)
      const { attestors, feed: feedID } = performanceChallenge
      const [attestorID] = attestors
      const attestorAddress = await chainAPI.getUserAddress(attestorID)
      if (attestorAddress !== myAddress) return
      log({ type: 'chainEvent', data: { text: 'new-performance-challenge', info: `Attestor ${attestorID}:  Event received: ${event.method} ${event.data.toString()}` } })
      const hosterIDs = []
      const feed = await chainAPI.getFeedByID(feedID)
      const { feedkey, swarmkey, contracts: contractIDs } = feed
      const reports = []
      const chunks = {}
      const all_hosterIDs = []
      // get all hosters and select random chunks to check for each hoster
      for (var i = 0, len1 = contractIDs.length; i < len1; i++) {
        const { amendments, ranges } = await chainAPI.getContractByID(contractIDs[i])
        const { providers: { hosters: hosterIDs } } = await chainAPI.getAmendmentByID(amendments[amendments.length-1])
        for (var j = 0, len2 = hosterIDs.length; j < len2; j++) {
          const id = hosterIDs[j]
          all_hosterIDs.push(id)
          const x = getRandomInt(0, ranges.length + 1)
          log({ type: 'attester', data: { text: 'Selecting random range', ranges, x } })
          const random_range = ranges[x]
          chunks[id] = getRandomInt(random_range[0], random_range[1] + 1) // chain doesn't emit WHICH chunks attester should check
        }
        log({ type: 'challenge', data: { text: 'getting data for contract', contract: contractIDs[i], chunks } })
      }
      log({ type: 'challenge', data: { text: 'Got all hosterIds and chunks', chunks } })
      // join swarm and check performance when you connect to any of the hosters
      const mode = { server: false, client: true }
      const topic = swarmkey
      swarmAPI.swarm.join(topic, mode)
      swarmAPI.swarm.on('connection', async (socket) => {
        log({ type: 'attestor challenge', data: { text: `New connection` } })
        const ids = all_hosterIDs
        for (var i = 0, len = ids.length; i < len; i++) {
          const hosterID = ids.shift()
          const hosterkey = await chainAPI.getHosterKey(hosterID)
          console.log({remotekey, hosterkey})
          if (remotekey.equals(hosterkey)) {
            all_hosterIDs.splice(all_hosterIDs.indexOf(hosterID), 1) // remove that id from all_hosterIDs
            return onconnection
          } else {
            ids.unshift()
          }
        }
        onconnection(socket)
      })
      

      // swarmAPI.connect_topic(log, performanceChallengeID, topic, mode, async (remotekey) => {
      //   log({ type: 'attestor challenge', data: { text: `New connection` } })
      //   const ids = all_hosterIDs
      //   for (var i = 0, len = ids.length; i < len; i++) {
      //     const hosterID = ids.shift()
      //     const hosterkey = await chainAPI.getHosterKey(hosterID)
      //     console.log({remotekey, hosterkey})
      //     if (remotekey.equals(hosterkey)) {
      //       all_hosterIDs.splice(all_hosterIDs.indexOf(hosterID), 1) // remove that id from all_hosterIDs
      //       return onconnection
      //     } else {
      //       ids.unshift()
      //     }
      //   }
      // })

      async function onconnection (socket) {
        log({ type: 'info', data: { text: 'Got the right peer', peer: hosterID } })
        const core = new hypercore(RAM, feedkey, { valueEncoding: 'binary', sparse: true })
        socket.pipe(core.replicate(socket.isInitiator)).pipe(socket)
        core.on('download', () => socket.end())
        const [stats, event_sig ] = (await check_performance(core, chunks[hosterID], log).catch(err => log({ type: 'fail', data: err }))) || []
        const data = Buffer.from(`${performanceChallengeID}`, 'binary')
        if (!datdot_crypto.verify_signature(event_sig, data, socket.remotePublicKey)) event_sig = stats = undefined
        reports.push({ stats, hoster: socket.remotePublicKey, event_sig })
      }

      const resolved_reports = await Promise.all(reports).catch(err => log({ type: 'error', data: { text: 'Performance challenge error', err } }))
      resolved_reports.forEach(async report => report.hoster = await chainAPI.getUserIDByNoiseKey(report.hoster))
      log({ type: 'challenge', data: { text: 'Got all reports', resolved_reports } })
      await swarmAPI.disconnect_topic(topic, performanceChallengeID, log)
      // TODO: send just a summary to the chain, not the whole array
      const nonce = await vaultAPI.getNonce()
      log({ type: 'attestor', data: `Submitting performance challenge` })
      await chainAPI.submitPerformanceChallenge({ performanceChallengeID, reports: resolved_reports, signer, nonce })
    }
  }
 
}

/* ----------------------------------------------------------------------
                            HOSTING SETUP
---------------------------------------------------------------------- */

async function attest_hosting_setup (data) {
  const { amendmentID, feedKey, hosterKeys, hosterSigningKeys, attestorKey, encoderKeys, ranges, log } = data
  const messages = {}
  const responses = []
  for (var i = 0, len = encoderKeys.length; i < len; i++) {
    const encoderKey = encoderKeys[i]
    const hosterKey = hosterKeys[i]
    const hosterSigningKey = hosterSigningKeys[i]
    const unique_el = `${amendmentID}/${i}`
    const opts = { log, amendmentID, unique_el, attestorKey, encoderKey, hosterKey, hosterSigningKey, ranges, feedKey }
    opts.compare_encodings_CB = (msg, key) => compare_encodings({ messages, key, msg, log })
    log({ type: 'attestor', data: [`Verify encodings!`] })
    responses.push(verify_and_forward_encodings(opts))
  }

  const resolved_responses = await Promise.all(responses) // can be 0 to 6 pubKeys of failed providers
  const failed = []
  const sigs = []
  resolved_responses.forEach(res => {
    const { failedKeys, unique_el_signature, hosterKey } = res
    failed.push(failedKeys)
    sigs.push({ unique_el_signature, hosterKey })
  })
  const failed_set =  [...new Set(failed.flat())]  
  const report = { failedKeys: failed_set, sigs }
  return report
  
  async function verify_and_forward_encodings (opts) {
    const { log, amendmentID, unique_el, attestorKey, encoderKey, hosterKey, hosterSigningKey, feedKey, ranges, compare_encodings_CB } = opts
    const topic_encoder = derive_topic({ senderKey: encoderKey, feedKey, receiverKey: attestorKey, id: amendmentID })
    const topic_hoster = derive_topic({ senderKey: attestorKey, feedKey, receiverKey: hosterKey, id: amendmentID })
    const expectedChunkCount = getRangesCount(ranges)
    const failedKeys = []
    var unique_el_signature
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
          else log({ type: 'fail', data: err })
        }
      }
      else if (err.type === 'encoder_timeout') failedKeys.push(encoderKey)
      else log({ type: 'fail', data: err })
    }
    if (!unique_el_signature) failedKeys.push(hosterKey)
    return { failedKeys, unique_el_signature, hosterKey }
  
    async function handler (type, chunk) {      
      try {
        if (type === 'FAIL') {
          STATUS = 'FAILED'
          hoster_channel('QUIT')
          return
        }
        if (type === 'DONE') {
          STATUS = 'END'
          if (!pending) await hoster_channel('QUIT')
          return
        }
        if (type === 'DATA') {
          pending++
          await compare_encodings_CB(chunk, encoderKey)
          if (STATUS === 'FAILED') {
            pending--
            if (!pending) await hoster_channel('QUIT')
            return
          }
          await hoster_channel('SEND', chunk)
          pending--
          if (STATUS === 'END' || STATUS === 'FAILED') {
            if (!pending) await hoster_channel('QUIT')
            return
          }
        }
        // return 'NEXT'
      } catch (err) {
        log({type: 'attestor', data: [`ERROR, ${err}`]})
        pending--
        if (STATUS === 'END') {
          if (!pending) await hoster_channel('QUIT')
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
        else  log({ type: 'fail', data: err })
      }
    }
  
    async function connect_to (role, isSender, topic, expectedChunkCount) {
      const chunks = {}
      var ext_received = {}
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
            const index = ack.start
            const store = chunks[index]
            const resolve = store.resolve
            chunks[index] = ack
            resolve()
          })
          // get hoster signature of the unique_el
          var ext = core.registerExtension(unique_el, { 
            encoding: 'binary',
            async onmessage (sig, peer) {
              unique_el_signature = sig
              const data = Buffer.from(unique_el, 'binary')
              if (!datdot_crypto.verify_signature(sig, data, hosterSigningKey)) unique_el_signature = undefined
              log({ type: 'attestor', data: { text: 'Extension message with hoster signature received and verified', unique_el_signature } })
              if (ext_received.resolve) ext_received.resolve()
            },
            onerror (err) {
              reject(err)
            }
          })
          resolve(channel)
        }
  
        async function channel (type, data) {
          if (type === 'QUIT') {
            return new Promise(async (resolve, reject) => {
              if (!unique_el_signature) await new Promise((resolve, reject) => {
                ext_received.resolve = resolve
              })
              clearTimeout(tid)
              // beam.destroy()
              resolve()
            })
          }
          else if (type === 'SEND') {
            return new Promise(async (resolve, reject) => {
              log({ type: 'attestor', data: { text: 'Got a message from encoder', amendmentID } })
              const message = await data
              log({ type: 'attestor', data: [`Awaited a message`] })
              const messageObj = JSON.parse(message)
              const parsed_message = proof_codec.encode(messageObj)
              const id = await core.append(parsed_message)
              // log({ type: 'attestor', data: { text: `send index - appending new message for hoster in hosting setup`, id } })
              chunks[id] = { resolve, reject }
              log({ type: 'info', data: { text: 'SENT INDEX TO HOSTER', id, amendmentID } })
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
                log({ type: 'attester', data: { text: 'hosting setup', expectedChunkCount, i, amendmentID, len: chunks.length } })
                promise.catch(err => {
                  log({ type: 'fail', data: { text: 'promise handlerCB', err } })
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
              handlerCB('DONE')
              status = 'END'
              await Promise.all(chunks)
              log({ type: 'attester', data: { text: 'Sending report', expectedChunkCount, len: chunks.length } })
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

  // connect to the hoster (get the feedkey, then start getting data)
  // make a list of all checks (all feedkeys, amendmentIDs...)
  // for each check, get data, verify and make a report
  // push report from each check into report_all
  // when all checks are done, report to chain
  
  return new Promise(async (resolve, reject) => {
    const { storageChallengeID, attestorKey, hosterKey, hosterSigningKey, checks, log } = data

    const log2hosterChallenge = log.sub(`<-HosterChallenge ${hosterKey.toString('hex').substring(0,5)}`)
    log2hosterChallenge({ type: 'attestor', data: [`Starting attest_storage_challenge}`] })
    
    const topic = [hosterKey, attestorKey, storageChallengeID].join('')
    const tid = setTimeout(() => {
      // beam.destroy()
      log('timeout')
      reject({ type: `attestor_timeout` })
    }, DEFAULT_TIMEOUT)

    const beam = new Hyperbeam(topic)
    beam.on('error', err => { 
      clearTimeout(tid)
      // beam.destroy()
      if (beam_once) {
        // beam_once.destroy()
        log({ type: 'fail', data: { text: 'beam error', err } })
        reject({ type: `attestor_connection_fail`, data: err })
      }
    })
    const once_topic = topic + 'once'
    var beam_once = new Hyperbeam(once_topic)
    beam_once.on('error', err => { 
      clearTimeout(tid)
      // beam_once.destroy()
      // beam.destroy()
      log({ type: 'fail', data: { text: 'beam once error', err } })
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
      // get chunks from hoster for all the checks
      const contract_ids = Object.keys(checks).map(stringID => Number(stringID))
      for (var i = 0, len = contract_ids.length; i < len; i++) {
        const data_promise = core.get(i)
        all.push(verify_chunk(data_promise))
      }
      try {
        var ext = core.registerExtension(`datdot-storage-challenge`, { 
          encoding: 'binary',
          async onmessage (storage_challenge_signature) {
            clearTimeout(tid)
            const info_msg = { type: 'attestor', data: [`Got datdot-storage-challenge signature`] }
            log2hosterChallenge(info_msg)
            const messageBuf = Buffer.alloc(varint.encodingLength(storageChallengeID))
            varint.encode(storageChallengeID, messageBuf, 0)
            if (!datdot_crypto.verify_signature(storage_challenge_signature, messageBuf, hosterSigningKey)) {
              log({ type: 'fail', data: 'not a valid event' })
              reject(storage_challenge_signature)
            }
            const reports = await Promise.all(all).catch(err => { log({ type: 'fail', data: err }) })
            if (!reports) log2hosterChallenge({ type: 'error', data: [`No reports`] })
            const res = {reports, storage_challenge_signature}
            // beam.destroy()
            resolve(res)
          },
          onerror (err) {
            reject(err)
          }
        })
      } catch (err) {
        log({ type: 'fail', data: { text: 'results error', err } })
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
        const { contractID, index, encoded_data, encoded_data_signature, nodes } = data
        log2hosterChallenge({ type: 'attestor', data: [`Storage proof received, ${index}`]})

        const check = checks[contractID] // { index, feedKey, signatures, ranges, amendmentID, encoder_pos, encoderSigningKey }
        const { index: check_index, feedKey, signatures, ranges, amendmentID, encoder_pos, encoderSigningKey } = check

        if (index !== check_index) reject(index)
        if (!datdot_crypto.verify_signature(encoded_data_signature, encoded_data, encoderSigningKey)) reject(index)
        const unique_el = `${amendmentID}/${encoder_pos}`
        const decompressed = await brotli.decompress(encoded_data)
        await datdot_crypto.verify_chunk_hash(index, decompressed, unique_el, nodes).catch(err => reject('not valid chunk hash', err))
        const keys = Object.keys(signatures)
        const indexes = keys.map(key => Number(key))
        const max = get_max_index(ranges)
        const version = indexes.find(v => v >= max)
        const not_verified = datdot_crypto.merkle_verify({feedKey, hash_index: index * 2, version, signature: Buffer.from(signatures[version], 'binary'), nodes})
        if (not_verified) reject(not_verified)
        log2hosterChallenge({ type: 'attestor', data: `Storage verified for ${index}` })
        resolve({ contractID, version, nodes })
      })
    }

  })
}

/* ----------------------------------------------------------------------
                        CHECK PERFORMANCE
---------------------------------------------------------------------- */

async function check_performance (core, index, log) {
  log({ type: 'challenge', data: { text: 'checking performance' } })
  return new Promise(async (resolve, reject) => {
    const reports = []
    const tid = setTimeout(() => {
      log('performance challenge - timeout')
      reject('performance challenge failed')
    }, DEFAULT_TIMEOUT)
    

    log({ type: 'challenge', data: { text: 'getting stats', data: index } })
    clearTimeout(tid)
    const stats = await get_data_and_stats(core, index, log).catch(err => log({ type: 'fail', data: err }))
    log({ type: 'performance', data: { stats: JSON.stringify(stats) } })
    reports.push(stats)
    await on_ext_message(core, log, () => done)

    function done (err, event_sig) {
      if (err) reject(err)
      reports.push(event_sig)
      log({ type: 'info', data: {text:'Resolving check_performance_for', reports, event_sig } })
      resolve(reports)
    }
  })
}

async function connect_and_replicate (core, log) {
  return new Promise(async (resolve, reject) => {
    log({ type: 'attestor', data: [`Start to connect and to replicate`] })

    const topic = feed.discoveryKey
    
    await hypercore_replicated(feed)
    resolve()
  })
}

async function on_ext_message (feed, log, done) {
  // return 'foo'
  const string_key = feed.key.toString('hex')
  feed.registerExtension('datdot-hoster', { 
    encoding: 'binary',
    async onmessage (perf_sig) {
      log('got an ext message')
      done(null, perf_sig)
    },
    onerror (err/* peerSocket???*/) {
      // TODO: disconnect from peer
      log({ type: 'fail', data: 'err extension message' })
      done(err)
    }
  })
}

async function get_data_and_stats (feed, index, log) {
  log({ type: 'challenge', data: { text: 'Getting data and stats', index } })
  console.log({ feed })
  return new Promise(async (resolve, reject) => {
    try {
      const start = performance.now()
      await download_range(feed, [index, index+1])
      const data = await get_index(feed, index) 
      if (!is_verified(data)) return
      const end = performance.now()
      const latency = end - start
      const stats = await getStats(feed)
      stats.latency = latency
      resolve(stats)
    } catch (e) {
      log(`Error: ${feed.key}@${index} ${e.message}`)
      reject()
    }

    function is_verified (data) {
      return true
    }

    function getStats () {
      if (!feed) return {}
      const stats = feed.stats
      const openedPeers = feed.peers.filter(p => p.remoteOpened)
      const networkingStats = {
        key: feed.key,
        discoveryKey: feed.discoveryKey,
        peerCount: feed.peers.length,
        peers: openedPeers.map(p => { return { ...p.stats, remoteAddress: p.remoteAddress }})
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

 // HELPERS

 async function get_storage_challenge_data (storageChallenge, chainAPI) {
  const { id, checks, hoster: hosterID, attestor: attestorID } = storageChallenge
  const contract_ids = Object.keys(checks).map(stringID => Number(stringID))
  const hosterSigningKey = await chainAPI.getSigningKey(hosterID)
  const hosterKey = await chainAPI.getHosterKey(hosterID)
  const attestorKey = await chainAPI.getAttestorKey(attestorID)
  for (var i = 0, len = contract_ids.length; i < len; i++) {
    const contract_id = contract_ids[i]
    const contract = await chainAPI.getItemByID(contract_id)
    const { feed: feedID, ranges, amendments } = await chainAPI.getContractByID(contract_id)
    const [encoderID, pos] = await getEncoderID(amendments, hosterID, chainAPI)
    const { feedkey, signatures } = await chainAPI.getFeedByID(feedID)

    checks[contract_id].feedKey = feedkey
    checks[contract_id].signatures = signatures
    checks[contract_id].ranges = ranges
    checks[contract_id].encoderSigningKey = await chainAPI.getSigningKey(encoderID)
    checks[contract_id].encoder_pos = pos
    checks[contract_id].amendmentID = amendments[amendments.length - 1]
    // checks[contract_id] = { index, feedKey, signatures, ranges, amendmentID, encoder_pos, encoderSigningKey }
  }
  return { storageChallengeID: id, attestorKey, hosterKey, hosterSigningKey, checks }
}

async function getEncoderID (amendments, hosterID, chainAPI) {
  const active_amendment = await chainAPI.getAmendmentByID(amendments[amendments.length-1])
  const pos =  active_amendment.providers.hosters.indexOf(hosterID)
  const encoderID = active_amendment.providers.encoders[pos]
  return [encoderID, pos]
}

async function getData (chainAPI, amendment, contract) {
  const { encoders, hosters } = amendment.providers
  const enc_promises = encoders.map(async (id) => chainAPI.getEncoderKey(id))
  const encoderKeys = await Promise.all(enc_promises)
  const hoster_promises = []
  const signingkey_promises = []
  hosters.forEach(async (id) => {
    signingkey_promises.push(chainAPI.getSigningKey(id))
    hoster_promises.push(chainAPI.getHosterKey(id))
  })
  const feedID = contract.feed
  const feedKey_promise = chainAPI.getFeedKey(feedID)

  const hosterKeys = await Promise.all(hoster_promises)
  const hosterSigningKeys = await Promise.all(signingkey_promises)
  const feedKey = await feedKey_promise

  const ranges = contract.ranges
  return { feedKey, encoderKeys, hosterKeys, hosterSigningKeys, ranges }
}

function getRandomInt (min, max) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min)) + min // The maximum is exclusive and the minimum is inclusive
}
