const derive_topic = require('derive-topic')
const brotli = require('_datdot-service-helpers/brotli')
const b4a = require('b4a')

const { performance } = require('perf_hooks')

const datdot_crypto = require('datdot-crypto')
const proof_codec = require('datdot-codec/proof')
const {done_task_cleanup} = require('_datdot-service-helpers/done-task-cleanup')
const parse_decompressed = require('_datdot-service-helpers/parse-decompressed')

const tempDB = require('_tempdb')
const getRangesCount = require('getRangesCount')
const compare_encodings = require('compare-encodings')
const DEFAULT_TIMEOUT = 10000

/******************************************************************************
  ROLE: Attester
******************************************************************************/

module.exports = APIS => { 
  
  return attester

  async function attester (vaultAPI) {
    const { chainAPI } = APIS
    const account = vaultAPI
    const { identity, log, hyper } = account
    const { myAddress, signer, noiseKey: attesterKey } = identity
    // log({ type: 'attester', data: [`I am an attester`] })
    const jobsDB = await tempDB(attesterKey)
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
        attesterAddress
        const [planID] = event.data
        const jobIDs = unpublishedPlan_jobIDs(planID)
        jobIDs.forEach(jobID => {
          const job = jobsDB.get(jobID)
          if (job) { /* TODO: ... */ }
        })
      }
      else if (event.method === 'NewAmendment') {
        const [amendmentID] = event.data
        const amendment = await chainAPI.getAmendmentByID(amendmentID)
        const contract = await chainAPI.getContractByID(amendment.contract)
        const [attesterID] = amendment.providers.attesters
        const attesterAddress = await chainAPI.getUserAddress(attesterID)
        if (attesterAddress !== myAddress) return

        const tid = setTimeout(() => {
          log({ type: 'timeout', data: { texts: 'error: hosting setup - timeout', amendmentID } })

        }, DEFAULT_TIMEOUT)

        log({ type: 'attester', data: { text: `Attester ${attesterID}: Event received: ${event.method} ${event.data.toString()}`, amendment: JSON.stringify(amendment)} })
        const { 
          feedKey, 
          encoderKeys, 
          hosterSigningKeys, 
          hosterKeys, 
          ranges 
        } = await getAmendmentData({ chainAPI, amendment, contract, log })
        
        const data = { 
          account, 
          amendmentID, 
          feedKey, 
          hosterKeys, 
          attesterKey, 
          encoderKeys, 
          hosterSigningKeys, 
          ranges, 
          log 
        }
        const { failedKeys, sigs } = await attest_hosting_setup(data).catch(err => {
          log({ type: 'hosting setup', data: { text: 'error: hosting setup', amendmentID }})
          return
        })
        log({ type: 'attester', data: { text: `Hosting setup done`, amendmentID, failedKeys, sigs } })
        const signatures = {}
        for (const sig of sigs) {
          const { proof_of_contact, hosterKey } = sig
          const hoster_id = await chainAPI.getUserIDByNoiseKey(b4a.from(hosterKey, 'hex'))
          signatures[hoster_id] = proof_of_contact
        }
        const report = { id: amendmentID, failed: failedKeys, signatures }
        clearTimeout(tid)
        const nonce = await vaultAPI.getNonce()
        await chainAPI.amendmentReport({ report, signer, nonce })
      }
      else if (event.method === 'HostingStarted') {
        const [amendmentID] = event.data
      }
      else if (event.method === 'NewStorageChallenge') {
        const [storageChallengeID] = event.data
        const storageChallenge = await chainAPI.getStorageChallengeByID(storageChallengeID)
        const { attester: attesterID, checks } = storageChallenge
        const attesterAddress = await chainAPI.getUserAddress(attesterID)
        if (attesterAddress !== myAddress) return
        log({ type: 'chainEvent', data: `Attester ${attesterID}:  Event received: ${event.method} ${event.data.toString()}` })      
        const attestation = { response: { storageChallengeID, status: undefined, reports: [] },  signer }
        var conn // set to true once connection with hoster is established
        const tid = setTimeout(async () => {
          log({ type: 'timeout', data: { texts: 'error: storage challenge - timeout', storageChallengeID } })
          attestation.nonce = await vaultAPI.getNonce()
          
          if (conn) attestation.response.status = 'no-data' // connection was established, but no data was sent
          else attestation.response.status = 'fail' //no connection was established between hoster and attester, reponse is empty
          await chainAPI.submitStorageChallenge(attestation)
          return
        }, DEFAULT_TIMEOUT)

        const data = await get_storage_challenge_data({ chainAPI, storageChallenge })
        const res = await attest_storage_challenge({ data, account, conn, log }).catch(async err => {
          log({ type: 'storage challenge', data: { text: 'error: attest storage', storageChallengeID }})
          attestation.nonce = await vaultAPI.getNonce()
          if (err.cause === 'invalid-proof' || err.cause === 'no-data') {
            attestation.response.status = err.cause 
          }
          await chainAPI.submitStorageChallenge(attestation)
          return
        })
        if (res) {
          log({ type: 'storage challenge', data: { text: 'sending storage proof to the chain', storageChallengeID }})
          clearTimeout(tid)
          const { proof_of_contact, reports } = res
          const failed = reports.filter(r => r === 'failed')
          attestation.nonce = await vaultAPI.getNonce()
          attestation.response.status = failed.length? 'failed' : 'success'
          attestation.response.proof_of_contact = proof_of_contact
          attestation.response.reports = reports
          await chainAPI.submitStorageChallenge(attestation)
        } else {
          log({ type: 'storage challenge', data: { text: 'error: no response', storageChallengeID }})
          attestation.nonce = await vaultAPI.getNonce()
          await chainAPI.submitStorageChallenge(attestation)
        }

      }
      else if (event.method === 'NewPerformanceChallenge') {
        const [challengeID] = event.data
        const performanceChallenge = await chainAPI.getPerformanceChallengeByID(challengeID)
        const { attesters, feed: feedID } = performanceChallenge
        const [attesterID] = attesters
        const attesterAddress = await chainAPI.getUserAddress(attesterID)
        if (attesterAddress !== myAddress) return
        log({ type: 'chainEvent', data: { text: 'new-performance-challenge', info: `Attester ${attesterID}:  Event received: ${event.method} ${event.data.toString()}` } })
        const feedObj = await chainAPI.getFeedByID(feedID)
        const { feedkey, contracts: contractIDs } = feedObj
        const topic = datdot_crypto.get_discoverykey(feedkey)
        log({ type: 'challenge', data: { text: 'Performance challenge for feed', feedObj } })
        const { hosterkeys, hoster_ids, chunks } = await get_hosters_and_challenge_chunks({ chainAPI, contractIDs, log })
        
        var conns = {}
        var attesting = []
        var reports = {}
        var tids = {}

        const opts = { 
          account, 
          chainAPI, 
          hyper, 
          challengeID, 
          reports, 
          feedkey, 
          topic,
          chunks,
          tids,
          conns,
          log 
        }

        for (var i = 0; i < hosterkeys.length; i++) {
          const hoster_id = hoster_ids[i]
          const hosterkey = hosterkeys[i]
          const tid = setTimeout(() => {
            log({ type: 'timeout', data: { texts: 'error: performance challenge - timeout', challengeID, hoster_id } })
            reports[hoster_id] = { status: 'fail' } 
            return
          }, DEFAULT_TIMEOUT)
          tids[hoster_id] = tid
          opts.hosterkey = hosterkey
          opts.hoster_id = hoster_id
          attesting.push(attest_performance(opts))
        }
        
        const settled = await Promise.allSettled(attesting)
        for (var i = 0; i < settled.length; i++) {
          log({ type: 'performance', data: { texts: 'promises settled', settled_len: settled.length } })
          const res = settled[i]
          const hoster_id = res.value
          if (res.status === 'rejected') reports[hoster_id].status = 'fail'
          const remotestringkey = hosterkeys[i]
          done_task_cleanup({ role: 'performance_attester', topic, remotestringkey, state: account.state, log })
        }

         // TODO: send just a summary to the chain, not the whole array
        const nonce = await vaultAPI.getNonce()
        await chainAPI.submitPerformanceChallenge({ challengeID, reports, signer, nonce })        
      }
    }
  }

  /* ----------------------------------------------------------------------
                              HOSTING SETUP
  ---------------------------------------------------------------------- */

  async function attest_hosting_setup (data) {
    return new Promise(async (resolve, reject) => {
      const { account, amendmentID, feedKey, hosterKeys, attesterKey, encoderKeys, hosterSigningKeys, ranges, log } = data
      const failedKeys = []
      const sigs = []
      try {
        const messages = {}
        const promises = []
        const encoders_len = encoderKeys.length
        // Stop the main operation
        // log({ type: 'attester', data: { text: `Attest hosting setup`, amendmentID, encoderKeys } })
        for (var i = 0, len = encoders_len; i < len; i++) {
          const encoderKey = await encoderKeys[i]
          const hosterKey = await hosterKeys[i]
          const id = amendmentID
          const topic1 = derive_topic({ senderKey: encoderKey, feedKey, receiverKey: attesterKey, id, log })
          const topic2 = derive_topic({ senderKey: attesterKey, feedKey, receiverKey: hosterKey, id, log }) 

          const unique_el = `${amendmentID}/${i}`
          const hosterSigningKey = hosterSigningKeys[i]

          const opts = { 
            account, 
            topic1, 
            topic2, 
            encoderKey, 
            hosterSigningKey, 
            hosterKey, 
            unique_el, 
            ranges, 
            log 
          }
          opts.compare_CB = (msg, key) => compare_encodings({ messages, key, msg, log })
          promises.push(verify_and_forward_encodings(opts))
        }
        
        const reponses = await Promise.all(promises) // can be 0 to 6 pubKeys of failed providers
        // log({ type: 'attester', data: { text: `Resolved responses!`, reponses } })
        for (const res of reponses) {
          const { failedKeys: failed, proof_of_contact, hosterKey } = res
          failedKeys.push(failed)
          sigs.push({ proof_of_contact, hosterKey })
        }
        // log({ type: 'attester', data: { text: 'resolved responses', amendmentID, failed, sigs_len: sigs.length } })
        const report = { failedKeys: [...new Set(failedKeys.flat())], sigs }        
        resolve(report)
      } catch(err) {
        log({ type: 'fail', data: { text: 'Error: attest_hosting_setup', err }})
        for (const key of encoderKeys) failedKeys.push(key.toString('hex'))
        for (const key of hosterKeys) failedKeys.push(key.toString('hex'))
        reject(err)
      }
    })
  }
    
  async function verify_and_forward_encodings (opts) {
    const { account, topic1, topic2, encoderKey, hosterSigningKey, hosterKey, unique_el, ranges, compare_CB, log } = opts
    const failedKeys = []
    return new Promise(async (resolve, reject) => {
      try {
        // log({ type: 'attester', data: { text: 'calling connect_compare_send', encoderKey: encoderKey.toString('hex') }})
        const proof_of_contact = await connect_compare_send({
          account,
          topic1, 
          topic2, 
          compare_CB, 
          key1: encoderKey, 
          key2: hosterKey, 
          hosterSigningKey,
          unique_el,
          ranges,
          log
        })
        log({ type: 'attester', data: { text: 'All compared and sent, resolving now', encoderKey: encoderKey.toString('hex'), proof_of_contact }})
        if (!proof_of_contact) failedKeys.push(hosterKey)
        resolve({ failedKeys, proof_of_contact, hosterKey })
      } catch (err) {
        log({ type: 'attester', data: { text: 'Error: verify_and_forward_encodings', hosterKey: hosterKey.toString('hex'), err }})
        failedKeys.push(encoderKey.toString('hex'), hosterKey.toString('hex'))
        reject({ failedKeys })
      }
    })
  }
  
  async function connect_compare_send (opts) {
    const { 
      account, 
      topic1, 
      topic2, 
      key1, 
      key2, 
      hosterSigningKey, 
      unique_el, 
      compare_CB, 
      ranges, 
      log 
    } = opts
    const { hyper } = account
    const expectedChunkCount = getRangesCount(ranges)
    const log2encoder = log.sub(`<-Attester to encoder, me: ${account.noisePublicKey.toString('hex').substring(0,5)}, peer: ${key1.toString('hex').substring(0,5)}`)
    const log2hoster = log.sub(`<-Attester to hoster, me: ${account.noisePublicKey.toString('hex').substring(0,5)}, peer: ${key2.toString('hex').substring(0,5)}`)
    
    return new Promise(async (resolve, reject) => {       
      var feed1
      var feed2
      var sentCount = 0
      const chunks = {}
      var proof_of_contact
      
      try {
        // CONNECT TO ENCODER
        log2encoder({ type: 'attester', data: { text: 'load feed', encoder: key1.toString('hex'), topic: topic1.toString('hex') }})
        await hyper.new_task({  newfeed: false, topic: topic1, log: log2encoder })
        
        log2encoder({ type: 'attester', data: { text: 'connect', encoder: key1.toString('hex') }})
        await hyper.connect({ 
          swarm_opts: { role: 'attester2encoder', topic: topic1, mode: { server: false, client: true } }, 
          targets: { targetList: [key1.toString('hex')], msg: { receive: { type: 'feedkey' } } },
          onpeer: onencoder,
          log: log2encoder
        })
        // log2encoder({ type: 'attester', data: { text: 'waiting for onencoder', key1: key1.toString('hex') }})
        
        async function onencoder ({ feed, remotestringkey }) {
          log2encoder({ type: 'attester', data: { text: 'Connected to the encoder', encoder: remotestringkey, expectedChunkCount, feedkey: feed.key.toString('hex') }})
          feed1 = feed
          for (var i = 0; i < expectedChunkCount; i++) {
            get_and_compare(feed1, i)
          }
        }

        async function get_and_compare (feed1, i) {
          try {
            log2encoder({ type: 'attester', data: { text: 'getting chunks', i, expectedChunkCount, key1 } })
            const chunk_promise = feed1.get(i)
            const chunk = await chunk_promise
            const res = await compare_CB(chunk_promise, key1)
            log2encoder({ type: 'attester', data: { text: 'chunk compare res', i, res: res.type, /*chunk*/ } })
            if (res.type !== 'verified') return reject('error: chunk not valid')
            try_send({ chunk, i, log: log2encoder })
          } catch(err) {
            log2encoder({ type: 'attester', data: { text: 'Error: get_and_compare_chunk' }})
            reject(err)
          }
        }


        // CONNECT TO HOSTER
        const { feed } = await hyper.new_task({ topic: topic2, log: log2hoster })
        feed2 = feed
        log2hoster({ type: 'attester', data: { text: 'load feed', hoster: key2.toString('hex'), topic: topic2.toString('hex') }})

        await hyper.connect({ 
          swarm_opts: { role: 'attester2hoster', topic: topic2, mode: { server: true, client: false } }, 
          targets: { feed: feed2, targetList: [key2.toString('hex')], msg: { send: { type: 'feedkey' } } } ,
          onpeer: onhoster,
          done,
          log: log2hoster
        })
        
        async function onhoster ({ feed, remotestringkey }) {
          log2hoster({ type: 'attester', data: { text: 'connected to the hoster', hoster: remotestringkey, topic: topic2.toString('hex'), chunks, feedkey: feed.key.toString('hex') }})
          for (var i = 0; i < expectedChunkCount; i++ ) {
            try_send({ i, feed2, log: log2hoster })
          }
        }

        function try_send ({ chunk, i, feed2, log }) {
          if (chunk) { // got chunk in onencoder
            if (!chunks[i]) { 
              chunks[i] = { chunk } 
              // log({ type: 'attester', data: { text: 'add chunk to chunks', i }})
            } 
            else {
              chunks[i].send_to_hoster(chunk)
              // log({ type: 'attester', data: { text: 'call send_to_hoster cb', i , chunk, cb: chunks[i]}})
              sentCount++
              delete chunks[i]
            }
          }
          else { // onhoster
            if (chunks[i]) {
              feed2.append(chunks[i].chunk)
              // log({ type: 'attester', data: { text: 'chunk appended - onhoster', i, sentCount, expectedChunkCount }})
              sentCount++
              delete chunks[i]
            } else { 
              // log({ type: 'attester', data: { text: 'add send_to_hoster cb to chunks', i }})
              chunks[i] = { send_to_hoster: (chunk) => { feed2.append(chunk) } } 
            }
          }
          if (sentCount === expectedChunkCount) {
            log({ type: 'attester', data: { text: 'all sent', sentCount, expectedChunkCount }})
            done({ type: 'all sent' })
          }
        } 
        
        async function done ({  type = undefined, proof = undefined, hosterkey = undefined }) { // hosting setup
          // called 2x: when all sentCount === expectedChunkCount and when hoster sends proof of contact
          log({ type: 'attester', data: { text: 'done called', proof, sentCount, expectedChunkCount }})
          if (proof) {
            const proof_buff = b4a.from(proof, 'hex')
            const data = b4a.from(unique_el, 'binary')
            if (!datdot_crypto.verify_signature(proof_buff, data, hosterSigningKey)) reject('not valid proof of contact')
            proof_of_contact = proof
          }          
          // if (proof) proof_of_contact = proof
          if (!proof_of_contact) return
          if ((sentCount !== expectedChunkCount)) return
          log({ type: 'attester', data: { text: 'have proof and all data sent', proof, sentCount, expectedChunkCount }})
          await done_task_cleanup({ role: 'attester2encoder', topic: topic1, remotestringkey: key1.toString('hex'), state: account.state, log })
          await done_task_cleanup({ role: 'attester2hoster', topic: topic2, remotestringkey: key2.toString('hex'), state: account.state, log })
          resolve(proof_of_contact)
        }

      } catch(err) {
        log({ type: 'fail', data: { text: 'Error: connect_compare_send', err }})
        clearTimeout(tid)
        reject(err)
      }

    })
  }



  /* ----------------------------------------------------------------------
                          VERIFY STORAGE CHALLENGE
  ---------------------------------------------------------------------- */
  // connect to the hoster (get the feedkey, then start getting data)
  // make a list of all checks (all feedkeys, amendmentIDs...)
  // for each check, get data, verify and make a report => push report from each check into report_all
  // when all checks are done, report to chain
  async function attest_storage_challenge ({ data, account, conn, log: parent_log }) {
    return new Promise(async (resolve, reject) => {
      const { hyper } = account
      const { id, attesterKey, hosterKey, hosterSigningKey, checks, feedkey_1 } = data
      const logStorageChallenge = parent_log.sub(`<-attester2hoster storage challenge, me: ${account.noisePublicKey.toString('hex').substring(0,5)}, peer: ${hosterKey.toString('hex').substring(0,5)}`)
      var reports = []
      var proof_of_contact
      const verifying = [] 
      
      const topic = derive_topic({ senderKey: hosterKey, feedKey: feedkey_1, receiverKey: attesterKey, id, log: logStorageChallenge })
      await hyper.new_task({ newfeed: false, topic, log: logStorageChallenge })
      logStorageChallenge({ type: 'attestor', data: { text: `New task (storage challenge) added` } })

      await hyper.connect({ 
        swarm_opts: { role: 'storage_attester', topic, mode: { server: false, client: true } },
        targets: { targetList: [ hosterKey.toString('hex') ], msg: { receive: { type: 'feedkey' } } },
        onpeer: onhoster,
        done,
      
        log: logStorageChallenge
      })

      async function onhoster ({ feed, remotestringkey }) {
        logStorageChallenge({ type: 'attestor', data: { text: `Connected to the storage chalenge hoster`, remotestringkey } })
        conn = true
        await get_data(feed)
      }

      async function get_data (feed) {
        try {
          // get chunks from hoster for all the checks
          const contract_ids = Object.keys(checks).map(stringID => Number(stringID))
          for (var i = 0, len = contract_ids.length; i < len; i++) {
            const data_promise = feed.get(i)
            verifying.push(verify_chunk(data_promise))
          }
          const settled = await Promise.allSettled(verifying)
          settled.forEach(res => {
            if (res.status === 'fulfilled') reports.push(res.value)
            if (res.status === 'rejected') reports.push('fail')
          })
          done({ type: 'got all data' })
        } catch (err) {
          logStorageChallenge({ type: 'error', data: [`error in get data: ${err}`] })
          reject(new Error('error in get data', { cause: 'no-data' }))
        }
      }

      function done ({ type = undefined, proof = undefined, hosterkey = undefined }) { // storage challenge
        // called 2x: when reports are ready and when hoster sends proof of contact
        // logStorageChallenge({ type: 'attester', data: { text: 'done called for storage challenge', proof, reports, proof_of_contact }})
        if (proof) {
          const proof_buff = b4a.from(proof, 'hex')
          const unique_el = `${id}`
          const data = b4a.from(unique_el, 'binary')
          if (!datdot_crypto.verify_signature(proof_buff, data, hosterSigningKey)) {
            const err = new Error('Hoster signature could not be verified', { cause: 'invalid-proof' })
            reject(err)
          }
          proof_of_contact = proof
        }
        if (!proof_of_contact) return
        if ((!reports || reports.length !== Object.keys(checks).length)) return
        logStorageChallenge({ type: 'attester', data: { text: 'have proof and all reports', proof_of_contact, reports_len: reports.length, checks_len: Object.keys(checks).length }})
        done_task_cleanup({ role: 'storage_attester', topic, remotestringkey: hosterKey.toString('hex'), state: account.state, log: logStorageChallenge })
        // doesn't need to send msg with type done, because it already sent ack-proof-of-contact
        resolve({ proof_of_contact, reports })
      }

      // @NOTE:
      // attester receives: encoded data, nodes + encoded_data_signature
      // attester verifies signed event
      // attester verifies if chunk is signed by the original encoder (signature, encoder's pubkey, encoded chunk)
      // attester decompresses the chunk and takes out the original data (arr[1])
      // attester merkle verifies the data: (feedkey, root signature from the chain (published by attester after published plan)  )
      // attester sends to the chain: nodes, signature, hash of the data & signed event

      function verify_chunk (chunk_promise) {
        return new Promise(async (resolve, reject) => {
          try {
            const chunk = await chunk_promise
            logStorageChallenge({ type: 'attester', data: { text: `Getting chunk`, chunk } })
            const json = chunk.toString()
            // logStorageChallenge({ type: 'attester', data: { text: `Getting json`, json } })
            const data = proof_codec.decode(json)
            let { contractID, index, encoded_data, encoded_data_signature, p } = data
            logStorageChallenge({ type: 'attester', data: { text: `Storage proof received`, index, contractID, p } })

            const check = checks[`${contractID}`] // { index, feedKey, signatures, ranges, amendmentID, encoder_pos, encoderSigningKey }
            const { index: check_index, feedKey, signatures, ranges, encoderSigningKey, encoder_pos, amendmentID  } = check
            const unique_el = `${amendmentID}/${encoder_pos}`

            if (index !== check_index) reject(index)
            // 1. verify encoder signature
            if (!datdot_crypto.verify_signature(encoded_data_signature, encoded_data, encoderSigningKey)) {
              const err = new Error('not a valid chunk', { cause: 'invalid-chunk', contractID, index })
              reject(err)
            }
            logStorageChallenge({ type: 'attester', data: { text: `Encoder sig verified`, index, contractID } })

            // 2. verify proof
            p = proof_codec.to_buffer(p)
            const proof_verified = await datdot_crypto.verify_proof(p, feedKey)
            if (!proof_verified) {
              const err = new Error('not a valid p', { cause: 'invalid-p', contractID, index })
              reject(err)
            }
            logStorageChallenge({ type: 'attester', data: { text: `Proof verified`, index, contractID } })

            // 3. verify chunk (see if hash matches the proof node hash)
            const decompressed = await brotli.decompress(encoded_data)
            const decoded = parse_decompressed(decompressed, unique_el)
            if (!decoded) return reject('parsing decompressed unsuccessful')
            const block_verified = await datdot_crypto.verify_block(p, decoded)
            if (!block_verified) return reject('chunk hash not valid' )
            logStorageChallenge({ type: 'attester', data: { text: `Chunk hash verified`, index, contractID } })
            
            logStorageChallenge({ type: 'attester', data: `Storage verified for ${index}` })
            resolve({ contractID, p: proof_codec.to_string(p) })
          } catch (err) {
            reject('verify chunk failed')
          }
        })
      }

    })
  }

  async function get_storage_challenge_data ({ chainAPI, storageChallenge }) {
    const { id, checks, hoster: hosterID, attester: attesterID } = storageChallenge
    const contract_ids = Object.keys(checks).map(stringID => Number(stringID))
    const hosterSigningKey = await chainAPI.getSigningKey(hosterID)
    const hosterKey = await chainAPI.getHosterKey(hosterID)
    const attesterKey = await chainAPI.getAttesterKey(attesterID)
    var feedkey_1
    for (var i = 0, len = contract_ids.length; i < len; i++) {
      const contract_id = contract_ids[i]
      const contract = await chainAPI.getItemByID(contract_id)
      const { feed: feed_id, ranges, amendments } = await chainAPI.getContractByID(contract_id)
      const [encoderID, pos] = await getEncoderID({ chainAPI, amendments, hosterID })
      const { feedkey, signatures } = await chainAPI.getFeedByID(feed_id)
      if (!feedkey_1) feedkey_1 = feedkey

      checks[contract_id].feedKey = feedkey
      checks[contract_id].signatures = signatures
      checks[contract_id].ranges = ranges
      checks[contract_id].encoderSigningKey = await chainAPI.getSigningKey(encoderID)
      checks[contract_id].encoder_pos = pos
      checks[contract_id].amendmentID = amendments[amendments.length - 1]
      // checks[contract_id] = { index, feedKey, signatures, ranges, amendmentID, encoder_pos, encoderSigningKey }
    }
    return { id, attesterKey, hosterKey, hosterSigningKey, checks, feedkey_1 }
  }

  async function getEncoderID ({ chainAPI, amendments, hosterID }) {
    const active_amendment = await chainAPI.getAmendmentByID(amendments[amendments.length-1])
    const pos =  active_amendment.providers.hosters.indexOf(hosterID)
    const encoderID = active_amendment.providers.encoders[pos]
    return [encoderID, pos]
  }

  async function getAmendmentData ({ chainAPI, amendment, contract, log }) {
    const { encoders, hosters } = amendment.providers
    const hosterKeysPromises = []
    const hosterSigningKeysPromises = []
    hosters.forEach(id => {
      hosterKeysPromises.push(chainAPI.getHosterKey(id))
      hosterSigningKeysPromises.push(chainAPI.getSigningKey(id))
    })
    const encoderKeys = await Promise.all(encoders.map((id) => chainAPI.getEncoderKey(id)))
    const hosterKeys = await Promise.all(hosterKeysPromises)
    const hosterSigningKeys = await Promise.all(hosterSigningKeysPromises)
    const feedID = contract.feed
    const feedKey = await chainAPI.getFeedKey(feedID)
    const ranges = contract.ranges
    log({ type: 'attester', data: { text: `Got keys for hosting setup`, data: feedKey, providers: amendment.providers, encoderKeys, hosterKeys, ranges } })
    return { feedKey, encoderKeys, hosterSigningKeys, hosterKeys, ranges }
  }

  /* ----------------------------------------------------------------------
                          CHECK PERFORMANCE
  ---------------------------------------------------------------------- */

  async function attest_performance (opts) {
    return new Promise(async (resolve, reject) => {
      const { 
        account, 
        chainAPI, 
        hyper, 
        challengeID, 
        hosterkey,
        hoster_id,
        reports, 
        feedkey,
        topic,
        chunks,
        tids,
        conns, 
       
        log 
      } = opts

      const field = `${topic.toString('hex')}-${hosterkey}`
      const { feed } = await hyper.new_task({ feedkey, topic, field, log })
      log({ type: 'challenge', data: { text: 'Got performance challenge feed', field, hosterkey, fedkey: feed.key.toString('hex') } })

      await hyper.connect({ 
        swarm_opts: { role: 'performance_attester', topic, mode: { server: false, client: true } }, 
        targets: { targetList: [hosterkey], feed },
        onpeer: onhoster,
        done,
        log
      })

      async function onhoster ({ remotestringkey: hosterkey }) {
        log({ type: 'attester', data: { text: 'connected to the host for performance challenge', hoster: hosterkey.toString('hex') }})
        conns[hoster_id] = true
        await feed.update()
        const to_check = chunks[hoster_id]
        const opts = { account, challengeID, feed, chunks: to_check, hosterkey, topic, log }
        const stats = await measure_performance(opts).catch(err => log({ type: 'fail', data: err })) || []
        reports[hoster_id] ? reports[hoster_id].stats = stats : reports[hoster_id] = { stats }
        done({ type: 'have the report' })
      }
      
      async function done ({ type = undefined, proof = undefined, hosterkey = undefined }) { // performance challenge
        // called 2x: when (reports_promises.length === expected_chunks_len) and when hoster sends proof of contact
        if (proof) {
          const proof_buff = b4a.from(proof, 'hex')
          const hostersigningkey = await chainAPI.getSigningKey(hoster_id)
          const data = b4a.from(challengeID.toString(), 'binary')
          log({ type: 'attester', data: { text: 'done called', proof_buff, hostersigningkey, hosterkey }})
          if (!datdot_crypto.verify_signature(proof_buff, data, hostersigningkey)) {
            log({ text: 'error: not valid proof of contact', hosterkey, proof, data})
            const err = new Error('Hoster signature could not be verified', { cause: 'invalid-proof', hoster_id })
            reject(err)
          }
          reports[hoster_id] ? reports[hoster_id].proof_of_contact = proof : reports[hoster_id] = { proof_of_contact: proof }
        }          
        const { stats, proof_of_contact } = reports[hoster_id]
        if (!stats || !proof_of_contact) return
        const tid = tids[hoster_id]
        clearTimeout(tid)
        resolve(hoster_id)
      }
    })
  }

  // get all hosters and select random chunks to check for each hoster
  async function get_hosters_and_challenge_chunks ({ chainAPI, contractIDs, log }) {
    return new Promise (async(resolve, reject) => {
      try {
        const chunks = {}
        const all_ids = []
        for (var i = 0, len1 = contractIDs.length; i < len1; i++) {
          const contract = await chainAPI.getContractByID(contractIDs[i])
          const { amendments, ranges } = contract
          const active_amendment = await chainAPI.getAmendmentByID(amendments[amendments.length-1])
          var { providers: { hosters: hoster_ids } } = active_amendment
          log({ type: 'challenge', data: { text: 'Getting hosters and chunks for contract' } })
          for (var j = 0, len2 = hoster_ids.length; j < len2; j++) {
            const id = hoster_ids[j]
            all_ids.push(id)
            const x = getRandomInt(0, ranges.length)
            log({ type: 'attester', data: { text: 'Selecting random range', ranges, x } })
            const random_range = ranges[x]
            chunks[id] = { indexes: [] } // chain doesn't emit WHICH chunks attester should check
            chunks[id].indexes.push(getRandomInt(random_range[0], random_range[1]))
          }
        }
        // when we have 2x same hoster - we check chunks from all contracts at once
        hoster_ids = [...new Set(all_ids)]
        const hosterkeysPromise = hoster_ids.map(async id => (await chainAPI.getHosterKey(id)).toString('hex'))
        const hosterkeys = await Promise.all(hosterkeysPromise)
        log({ type: 'performance challenge', data: { text: 'hosterkeys and chunks to test', all_ids, hosterkeys, chunks: JSON.stringify(chunks) } })
        resolve({ hosterkeys, hoster_ids, chunks })
      } catch (err) {
        log({ type: 'performance challenge', data: { text: 'Error in get_hosters_and_challenge_chunks', err: JSON.stringify(err) } })
        reject(err)
      }
    })
  }

  async function measure_performance ({ account, challengeID, feed, chunks, hosterkey, topic, log: parent_log }) {
    const log = parent_log.sub(`<-attester2hoster performance challenge, me: ${account.noisePublicKey.toString('hex').substring(0,5)}, peer: ${hosterkey.toString('hex').substring(0,5)}`)
    log({ type: 'challenge', data: { text: 'checking performance' } })
    return new Promise(async (resolve, reject) => {
      log({ type: 'challenge', data: { text: 'getting stats', data: chunks } })
      const stats = await get_data_and_stats({ feed, chunks, log }).catch(err => log({ type: 'fail', data: err }))
      // get proof of contact
      await request_proof_of_contact({ account, challenge_id: challengeID, hosterkey, topic, log })
      log({ type: 'performance check finished', data: { stats: JSON.stringify(stats) } })
      resolve(stats)
    })
  }

  async function request_proof_of_contact ({ account, challenge_id, hosterkey, topic, log }) {
    // request proof
    const remotestringkey = hosterkey.toString('hex')
    const channel = account.state.sockets[remotestringkey].channel
    const stringtopic = topic.toString('hex')
    const string_msg = channel.messages[0]
    log({ type: 'challenge', data: { text: 'requesting proof of contact', challenge_id, stringtopic, remotestringkey } })
    string_msg.send(JSON.stringify({ type: 'requesting-proof-of-contact', challenge_id, stringtopic }))    
    // receiving proof of contact through done cb
  }

  async function get_data_and_stats ({ feed, chunks, log }) {
    log({ type: 'challenge', data: { text: 'Getting data and stats', chunks } })
    return new Promise (async (resolve, reject) => {
      try {
        // const stats = await getStats(feed)
        const stats = {}
        const start = performance.now()
        // log({ type: 'challenge', data: { text: 'Downloading range', chunks: chunks.indexes } })
        // await download_range(feed, chunks.indexes)
        // log({ type: 'challenge', data: { text: 'Range downloaded', index } })
        for (const index of chunks.indexes) {
          log({ type: 'challenge', data: { text: 'Getting data for performance index', index } })
          const data = await feed.get(index)
          log({ type: 'challenge', data: { text: 'Got data for performance check', index } })
          if (!is_verified(data)) return
          log({ type: 'challenge', data: { text: 'Data for performance check verified', index } })
          const end = performance.now()
          const latency = end - start
          stats.latency = stats.latency ? (stats.latency + latency)/2 /* get average latency for all the chunks*/ : latency
        }
        resolve(stats)
      } catch (e) {
        log(`Error: ${feed.key}@${index} ${e.message}`)
        reject(e)
      }

      function is_verified (data) {
        return true
      }

      async function getStats () {
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

  function getRandomInt (min, max) {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min)) + min // The maximum is exclusive and the minimum is inclusive
  }

}