const RAM = require('random-access-memory')
const derive_topic = require('derive-topic')
const hyperswarm = require('hyperswarm')
const hypercore = require('hypercore')
const Hyperbeam = require('hyperbeam')
const brotli = require('_datdot-service-helpers/brotli')
const varint = require('varint')
const { data } = require('hypercore-crypto')
const { toPromises } = require('hypercore-promisifier')

const { performance } = require('perf_hooks')

const datdot_crypto = require('datdot-crypto')
const proof_codec = require('datdot-codec/proof')
const remove_task_from_cache = require('_datdot-service-helpers/remove-task-from-cache')

const tempDB = require('_tempdb')
const getRangesCount = require('getRangesCount')
const compare_encodings = require('compare-encodings')
const get_max_index = require('_datdot-service-helpers/get-max-index')
const get_index = require('_datdot-service-helpers/get-index')
const DEFAULT_TIMEOUT = 10500

// global variables
const organizer = {
}
/******************************************************************************
  ROLE: Attestor
******************************************************************************/

module.exports = APIS => { 
  
  return attester

  async function attester (identity, log) {
    const { chainAPI, vaultAPI, store } = APIS
    const { myAddress, signer, noiseKey: attestorKey } = identity
    log({ type: 'attestor', data: [`Listening to events for attestor role`] })
    const jobsDB = await tempDB(attestorKey)
    const account = await vaultAPI
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
        const { feedKey, encoderKeys, hosterKeys, hosterSigningKeys, ranges } = await getAmendmentData({chainAPI, amendment, contract,log})
        
        const data = { store, amendmentID, feedKey, hosterKeys, hosterSigningKeys, attestorKey, encoderKeys, ranges, log }
        const { failedKeys, sigs } = await attest_hosting_setup(data).catch((error) => {
          log({ type: 'error', data: { text: 'Caught error from hosting setup (attester)', error } })
          throw new Error('hosting setup (attester) error')
        })
        log({ type: 'attestor', data: { text: `Resolved all the responses for amendment`, amendmentID, failedKeys, sigs } })
        
        const failed = await Promise.all(failedKeys.map(async (id) => await chainAPI.getUserIDByNoiseKey(Buffer.from(id, 'hex'))))
        log({ type: 'attestor', data: { text: `Failed key user IDs`, amendmentID, failed } })  
        const signatures = {}
        for (var i = 0, len = sigs.length; i < len; i++) {
          const { unique_el_signature, hosterKey } = sigs[i]
          const hoster_id = await chainAPI.getUserIDByNoiseKey(Buffer.from(hosterKey, 'hex'))
          signatures[hoster_id] = unique_el_signature
        }
        const report = { id: amendmentID, failed, signatures }
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
        const feedObj = await chainAPI.getFeedByID(feedID)
        const { feedkey, contracts: contractIDs } = feedObj
        log({ type: 'challenge', data: { text: 'Performance challenge for feed', feedObj } })
        const reports = []
        const { chunks, all_hosterIDs } = await get_hosters_and_challenge_chunks(contractIDs)
        // get all hosters and select random chunks to check for each hoster
        async function get_hosters_and_challenge_chunks (contractIDs) {
          const chunks = {}
          const all_ids = []
          for (var i = 0, len1 = contractIDs.length; i < len1; i++) {
            const contract = await chainAPI.getContractByID(contractIDs[i])
            const { amendments, ranges } = contract
            const active_amendment = await chainAPI.getAmendmentByID(amendments[amendments.length-1])
            const { providers: { hosters: hosterIDs } } = active_amendment
            log({ type: 'challenge', data: { text: 'Getting hosters and chunks for contract', contract, active_amendment, hosterIDs } })
            for (var j = 0, len2 = hosterIDs.length; j < len2; j++) {
              const id = hosterIDs[j]
              all_ids.push(id)
              const x = getRandomInt(0, ranges.length)
              log({ type: 'attester', data: { text: 'Selecting random range', ranges, x } })
              const random_range = ranges[x]
              chunks[id] = { indexes: [] } // chain doesn't emit WHICH chunks attester should check
              chunks[id].indexes.push(getRandomInt(random_range[0], random_range[1]))
            }
          }
          // hen we have 2x same hoster - we check chunks from all contracts at once
          const all_hosterIDs = [...new Set(all_ids)]
          log({ type: 'challenge', data: { text: 'Got all hoster Ids and chunks', contract: contractIDs[i], all_ids, all_hosterIDs, chunks: JSON.stringify(chunks) } })
          return { chunks, all_hosterIDs }
        }
        

        // join swarm and check performance when you connect to any of the hosters
        const role = 'attestor-challenge'
        const peerList = await Promise.all(all_hosterIDs.map(id => chainAPI.getHosterKey(id).toString('hex')))

        const { feed } = await store.load_feed({ // feed for challenge
          config: { intercept: false, fresh: true, persist: false },
          extension: { ext_cbs: { onmessage, onerror }, name: `datdot-hoster-${stringkey}` },
          swarm_opts: { mode: { server: false, client: true } },
          feedkey, 
          peers: { peerList, onpeer },
          log
        })

        log({ type: 'challenge', data: { text: 'Got challenge feed', fedkey: feed.key.toString('hex') } })
        
        async function onpeer ({ remotekey: hosterkey }) {
          const hosterID = await chainAPI.getHosterKey(hosterkey)
          await feed.update()
          log({ type: 'challenge', data: { text: 'Got hosterkey from ', hosterID, hosterkey: hosterkey.toString('hex') } })
          const stats = (await check_performance(feed, chunks[hosterID], log).catch(err => log({ type: 'fail', data: err }))) || []
          reports[hosterID] = { stats, hoster: hosterkey }
        }
        
        const ext = account.cache.topics[feed.discoveryKey.toString('hex')].ext
        function onerror (err/* peerSocket???*/) {
            // TODO: disconnect from peer
            log({ type: 'attestor', data: 'error extension message' })   
        }
        async function onmessage (event_sig, hosterkey) {
          if (err) {
            event_sig = undefined
            log({ type: 'challenge', data: { text: 'No event signature', err } })
          }
          log({ type: 'challenge', data: { text: 'Got event signature and hosterkey', event_sig, hosterkey } })
          const hosterID = await chainAPI.getUserIDByNoiseKey(hosterkey)
          const data = Buffer.from(`${performanceChallengeID}`, 'binary')
          if (!datdot_crypto.verify_signature(event_sig, data, hosterkey)) {
          }
          reports[hosterID].event.sig = event_sig

          if (reports.length === all_hosterIDs.length) {
            const resolved_reports = await Promise.all(reports).catch(err => log({ type: 'error', data: { text: 'Performance challenge error', err } }))
            resolved_reports.forEach(async report => report.hoster = await chainAPI.getUserIDByNoiseKey(report.hoster))
            log({ type: 'challenge', data: { text: 'Got all reports', resolved_reports } })
            // remove task from feed-storage
            // await remove_task_from_cache({ store, topic: feed.discoveryKey, cache_type: account.cache['fresh'][next], log })
            // TODO: send just a summary to the chain, not the whole array
            const nonce = await vaultAPI.getNonce()
            log({ type: 'attestor', data: `Submitting performance challenge` })
            await chainAPI.submitPerformanceChallenge({ performanceChallengeID, reports: resolved_reports, signer, nonce })
          }
          
        }

      }
    }
  
  }

  /* ----------------------------------------------------------------------
                              HOSTING SETUP
  ---------------------------------------------------------------------- */

  async function attest_hosting_setup (data) {
    const { store, amendmentID, feedKey, hosterKeys, hosterSigningKeys, attestorKey, encoderKeys, ranges, log } = data
    const messages = {}
    const responses = []
    log({ type: 'attestor', data: { text: `Attest hosting setup`, amendmentID, encoderKeys } })
    for (var i = 0, len = encoderKeys.length; i < len; i++) {
      const encoderKey = await encoderKeys[i]
      const hosterKey = await hosterKeys[i]
      const hosterSigningKey = await hosterSigningKeys[i]
      const unique_el = `${amendmentID}/${i}`
      const opts = { store, amendmentID, unique_el, attestorKey, encoderKey, hosterKey, hosterSigningKey, ranges, feedKey, log }
      opts.compare_CB = (msg, key) => compare_encodings({ messages, key, msg, log })
      responses.push(verify_and_forward_encodings(opts))
    }
    
    const resolved_responses = await Promise.all(responses) // can be 0 to 6 pubKeys of failed providers
    log({ type: 'attestor', data: { text: `Resolved responses!`, resolved_responses } })
    const failed = []
    const sigs = []
    resolved_responses.forEach(res => {
      const { failedKeys, unique_el_signature, hosterKey } = res
      failed.push(failedKeys)
      sigs.push({ unique_el_signature, hosterKey })
    })
    console.log({ text: 'resolved responses', amendmentID, failed, sigs_len: sigs.length })
    const failed_set =  [...new Set(failed.flat())]  
    const report = { failedKeys: failed_set, sigs }
    return report
  }
    
  async function verify_and_forward_encodings (opts) {
    const { store, amendmentID, unique_el, attestorKey, encoderKey, hosterKey, hosterSigningKey, feedKey, ranges, compare_CB, log } = opts
    const failedKeys = []
    var unique_el_signature
    return new Promise(async (resolve, reject) => {
      const tid = setTimeout(() => {
        reject({ type: `compare and send_timeout` })
      }, DEFAULT_TIMEOUT)
      try {
        log({ type: 'attester', data: { text: 'trying to connect to the encoder', encoderKey }})
        await connect_compare_send({
          store,
          topic1: derive_topic({ senderKey: encoderKey, feedKey, receiverKey: attestorKey, id: amendmentID, log }), 
          topic2: derive_topic({ senderKey: attestorKey, feedKey, receiverKey: hosterKey, id: amendmentID, log }), 
          compare_CB, 
          key2: hosterKey, 
          key1: encoderKey, 
          expectedChunkCount: getRangesCount(ranges) ,
          log
        })
        if (!unique_el_signature) failedKeys.push(hosterKey)
        clearTimeout(tid)
        resolve({ failedKeys, unique_el_signature, hosterKey })
      } catch (err) {
        log({ type: 'attester', data: { text: 'Error: verify_and_forward_encodings', hosterKey }})
        reject()
      }
    })
  }
  
  async function connect_compare_send (opts) {
    const { store, topic1, topic2, key1, key2, compare_CB, expectedChunkCount, log } = opts
    const log2encoder = log.sub(`<-Attestor to encoder ${key1.toString('hex').substring(0,5)}`)
    const log2hoster = log.sub(`<-Attestor to hoster ${key2.toString('hex').substring(0,5)}`)

    return new Promise(async (resolve, reject) => {       
      const tid = setTimeout(() => {
        reject({ type: `compare and send_timeout` })
      }, DEFAULT_TIMEOUT)
      
      try {
        var feed1
        var feed2
        var chunks = []

        // CONNECT TO ENCODER
        await store.load_feed({  newfeed: false, topic: topic1, log: log2encoder })
            
        await store.connect({ 
          swarm_opts: { topic: topic1, mode: { server: false, client: true } }, 
          peers: { peerList: [key1.toString('hex')], onpeer: onencoder,  msg: { receive: { type: 'feedkey' } } },
          log: log2encoder
        })

        async function onencoder ({ feed, remotekey }) {
          feed1 = feed
          log({ type: 'attestor', data: { text: 'Connected to the encoder', expectedChunkCount }})
          // get replicated data
          for (var i = 0; i < expectedChunkCount; i++) {
            chunks.push(compare_and_fwd_chunk({ feed1, i, key1, compare_CB, expectedChunkCount, log }))
          }
          log({ type: 'attester', data: { text: 'chunks compared', chunks: chunks.length } })
        }
        
        // CONNECT TO HOSTER
        
        const { feed} = await store.load_feed({ topic: topic2, log: log2hoster })
        feed2 = feed
        
        await store.connect({ 
          swarm_opts: { topic: topic2, mode: { server: true, client: false } }, 
          peers: { feed: feed2, peerList: [ key2.toString('hex') ], onpeer: onhoster, msg: { send: { type: 'feedkey' } } } ,
          log: log2hoster
        })
        
        async function onhoster ({ feed, remotekey }) {
          log({ type: 'attestor', data: { text: 'Connected to the hoster', topic: topic2.toString('hex') }})
          feed2 = feed
          await Promise.all(chunks)
          chunks.forEach(chunk => {
            feed2.append(chunk)
          })
          clearTimeout(tid)
          log({ type: 'attester', data: { text: 'Sending report', expectedChunkCount, len: chunks.length } })
          resolve()
        }

        
      } catch(err) {
        log({ type: 'fail', data: { text: 'Error: connect_compare_send', err }})
        reject(err)
      }
    })
  }

  async function compare_and_fwd_chunk ({ feed1, i, key1: encoderKey, compare_CB, expectedChunkCount, log }) {
    const chunk = feed1.get(i)
    await compare_CB(chunk, encoderKey)
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
      var core
      beam_once.once('data', async (data) => {
        const message = JSON.parse(data)
        if (message.type === 'feedkey') {
          const feedKey = Buffer.from(message.feedkey, 'hex')
          const clone = new hypercore(RAM, feedKey, { valueEncoding: 'binary', sparse: true })
          await clone.ready()
          core = clone
          const cloneStream = clone.replicate(true, { live: true })
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
          const data_promise = get_index(core, i, log2hosterChallenge)
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
          log2hosterChallenge({ type: 'attestor', data: { text: `Getting chunk`, chunk } })
          const json = chunk.toString('binary')
          log2hosterChallenge({ type: 'attestor', data: { text: `Getting json`, json } })
          const data = proof_codec.decode(json)
          const { contractID, index, encoded_data, encoded_data_signature, nodes } = data
          log2hosterChallenge({ type: 'attestor', data: { text: `Storage proof received, ${index}`, encoded_data } })

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

  async function check_performance (core, chunks, log) {
    log({ type: 'challenge', data: { text: 'checking performance' } })
    return new Promise(async (resolve, reject) => {
      const tid = setTimeout(() => {
        log('performance challenge - timeout')
        reject('performance challenge failed')
      }, DEFAULT_TIMEOUT)
    
      log({ type: 'challenge', data: { text: 'getting stats', data: chunks } })
      const stats = await get_data_and_stats(core, chunks, log).catch(err => log({ type: 'fail', data: err }))
      clearTimeout(tid)
      log({ type: 'performance', data: { stats: JSON.stringify(stats) } })
      resolve(stats)
    })
  }

  async function get_data_and_stats (feed, chunks, log) {
    log({ type: 'challenge', data: { text: 'Getting data and stats', chunks } })
    return new Promise(async (resolve, reject) => {
      try {
        const stats = await getStats(feed)
        const start = performance.now()
        // log({ type: 'challenge', data: { text: 'Downloading range', chunks: chunks.indexes } })
        // await download_range(feed, chunks.indexes)
        // log({ type: 'challenge', data: { text: 'Range downloaded', index } })
        for (var i = 0, len = chunks.indexes.length; i < len; i++) {
          const index = chunks.indexes[i]
          log({ type: 'challenge', data: { text: 'Getting data for performance index', index } })
          const data = await get_index(feed, index, log)
          log({ type: 'challenge', data: { text: 'Got data for performance check', index } })
          if (!is_verified(data)) return
          log({ type: 'challenge', data: { text: 'Data for performance check verified', index } })
          const end = performance.now()
          const latency = end - start
          stats.latency = stats.latency ? (stats.latency + latency)/2 /* get average latency for all the chunks*/ : latency
          if (i === (len - 1)) resolve(stats)
        }
      } catch (e) {
        log(`Error: ${feed.key}@${index} ${e.message}`)
        reject(e)
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

  async function getAmendmentData ({ chainAPI, amendment, contract, log }) {
    const { encoders, hosters } = amendment.providers
    const signingKeyPromises = []
    const hosterKeysPromises = []
    hosters.forEach(id => {
      signingKeyPromises.push(chainAPI.getSigningKey(id))
      hosterKeysPromises.push(chainAPI.getHosterKey(id))
    })
    const encoderKeys = await Promise.all(encoders.map((id) => chainAPI.getEncoderKey(id)))
    const hosterSigningKeys =  await Promise.all(signingKeyPromises)
    const hosterKeys = await Promise.all(hosterKeysPromises)
    const feedID = contract.feed
    const feedKey = await chainAPI.getFeedKey(feedID)
    const ranges = contract.ranges
    log({ type: 'attestor', data: { text: `Got keys for hosting setup`, data: feedKey, providers: amendment.providers, encoderKeys, hosterKeys, hosterSigningKeys, ranges } })
    return { feedKey, encoderKeys, hosterKeys, hosterSigningKeys, ranges }
  }

  function getRandomInt (min, max) {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min)) + min // The maximum is exclusive and the minimum is inclusive
  }

}