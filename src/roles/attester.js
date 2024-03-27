const derive_topic = require('derive-topic')
const brotli = require('_datdot-service-helpers/brotli')
const b4a = require('b4a')

const { performance } = require('perf_hooks')

const datdot_crypto = require('datdot-crypto')
const proof_codec = require('datdot-codec/proof')
const {done_task_cleanup} = require('_datdot-service-helpers/done-task-cleanup')
const parse_decompressed = require('_datdot-service-helpers/parse-decompressed')

const tempDB = require('_tempdb')
const getChunks = require('getChunks')
const compare_encodings = require('compare-encodings')
const DEFAULT_TIMEOUT = 10000

module.exports = APIS => { 
  return attester

  async function attester (vaultAPI) {
    const { chainAPI } = APIS
    const account = vaultAPI
    const { identity, log, hyper } = account
    const { myAddress, signer, noiseKey: attesterkey } = identity
    // log({ type: 'attester', data: [`I am an attester`] })
    chainAPI.listenToEvents(handleEvent)

    async function handleEvent (event) {
      const args = { event, chainAPI, account, signer, attesterkey, myAddress, hyper, log }
      const method = event.method
      if (method === 'hostingSetup' || method === 'retry_hostingSetup') handle_hostingSetup(args)
      else if (method === 'hostingSetup_failed') handle_hostingSetup_failed(args)
      else if (method === 'hostingStarted') {}
      else if (method === 'storageChallenge') storageChallenge_handler(args)
      else if (method === 'performanceChallenge') performanceChallenge_handler(args)
      else if (method === 'unpublishPlan') unpublishPlan_handler(args)
      else if (method === 'hosterReplacement') hosterReplacement_handler(args)
      else if (method === 'dropHosting') dropHosting_handler(args)
      else if (method === 'paused') paused_handler(args)
    }
  }
}


/* -----------------------------------------
            HOSTING SETUP FAILED
----------------------------------------- */

async function handle_hostingSetup_failed (args) {
  const { event, chainAPI, account, signer, attesterkey, myAddress, hyper, log } = args
  const [amendmentID] = event.data
  const amendment = await chainAPI.getAmendmentByID(amendmentID)
  const { providers: { hosters, encoders, attesters } } = amendment
  const [attesterID] = attesters
  const address = await chainAPI.getUserAddress(attesterID)
  if (address !== myAddress) return

  const contract = await chainAPI.getContractByID(amendment.contract)
  const { feed: feedID } = contract
  const { feedkey } = await chainAPI.getFeedByID(feedID)
  const myID = await chainAPI.getUserIDByNoiseKey(attesterkey)
  const { tasks } = account.state

  log({ type: 'attester', data: [`Event received: ${event.method} ${event.data.toString()}`] })   

  for (const id of hosters) {
    const hosterkey = await chainAPI.getHosterKey(id)
    const topic = derive_topic({ senderKey: attesterkey, feedkey, receiverKey: hosterkey, id: amendmentID, log }) 
    const stringtopic = topic.toString('hex')
    if (!tasks[stringtopic]) continue
    await done_task_cleanup({ role: 'attester2hoster', topic, remotestringkey: hosterkey.toString('hex'), state: account.state, log })
  }
  for (const id of encoders) {
    const encoderkey = await chainAPI.getEncoderKey(id)
    const topic = derive_topic({ senderKey: encoderkey, feedkey, receiverKey: attesterkey, id: amendmentID, log })
    const stringtopic = topic.toString('hex')
    if (!tasks[stringtopic]) continue
    await done_task_cleanup({ role: 'attester2encoder', topic, remotestringkey: encoderkey.toString('hex'), state: account.state, log })
  }

}

/* ----------------------------------------------------------------------
                            HOSTING SETUP
---------------------------------------------------------------------- */

async function handle_hostingSetup (args) {
  const { event, chainAPI, account, signer, attesterkey, myAddress, hyper, log } = args
  const [amendmentID] = event.data
  const amendment = await chainAPI.getAmendmentByID(amendmentID)
  const contract = await chainAPI.getContractByID(amendment.contract)
  const [attesterID] = amendment.providers.attesters
  const attesterAddress = await chainAPI.getUserAddress(attesterID)
  if (attesterAddress !== myAddress) return
  const conn = {}
  const failedKeys = []
  const sigs = []
  
  log({ type: 'attester', data: { text: `Attester ${attesterID}: Event received: ${event.method} ${event.data.toString()}`, amendment: JSON.stringify(amendment)} })
  
  const { feedkey, encoderkeys, hosterSigKeys, hosterkeys, ranges } 
  = await getAmendmentData({ chainAPI, amendment, contract, log })

  const tid = setTimeout(async () => {
    const hosterstringkeys = hosterkeys.map(key => key.toString('hex'))
    const encoderstringkeys = encoderkeys.map(key => key.toString('hex'))
    const peers = [...hosterstringkeys, ...encoderstringkeys]
    const id = amendmentID
    for (const key of peers) {
      if (conn[key]) continue
      failedKeys.push(key.toString('hex'))
    }
    for (const key of hosterstringkeys) {
      const topic = derive_topic({ senderKey: attesterkey, feedkey, receiverKey: key, id, log }) 
      await done_task_cleanup({ role: 'attester2hoster', topic, remotestringkey:key, state: account.state, log })
    }
    for (const key of encoderstringkeys) {
      const topic = derive_topic({ senderKey: key, feedkey, receiverKey: attesterkey, id, log })
      await done_task_cleanup({ role: 'attester2encoder', topic, remotestringkey: key, state: account.state, log })
    }
    // we connected to all but it still timed out
    if (!failedKeys.length) failedKeys.push(...hosterstringkeys, ...encoderstringkeys)
    log({ type: 'attester', data: { texts: 'error: hosting setup - timeout', amendmentID, failedKeys, conn, hosterkeys, encoderkeys, peers } })
      const report = { id: amendmentID, failed: failedKeys, sigs }
      const nonce = await account.getNonce()
      await chainAPI.hostingSetupReport({ report, signer, nonce })
  }, DEFAULT_TIMEOUT)

  
  const data = { 
    account, amendmentID, feedkey, 
    hosterkeys, attesterkey, encoderkeys, 
    hosterSigKeys, ranges, conn, failedKeys, sigs, log 
  }
  await attest_hosting_setup(data).catch(err => {
    log({ type: 'hosting setup', data: { text: 'error: hosting setup', amendmentID }})
    return
  })
  log({ type: 'attester', data: { text: `Hosting setup done`, amendmentID, failedKeys, sigs } })
  const signatures = {}
  for (const sig of sigs) {
    const { proof_of_contact, hosterkey } = sig
    const hoster_id = await chainAPI.getUserIDByNoiseKey(b4a.from(hosterkey, 'hex'))
    signatures[hoster_id] = proof_of_contact
  }
  const report = { id: amendmentID, failed: failedKeys, signatures }
  clearTimeout(tid)
  const nonce = await account.getNonce()
  await chainAPI.hostingSetupReport({ report, signer, nonce })
}

async function attest_hosting_setup (data) {
  return new Promise(async (resolve, reject) => {
    const { 
      account, amendmentID, feedkey, 
      hosterkeys, attesterkey, encoderkeys, 
      hosterSigKeys, ranges, conn, failedKeys, sigs, log 
    } = data
    try {
      const messages = {}
      const promises = []
      const encoders_len = encoderkeys.length
      // Stop the main operation
      // log({ type: 'attester', data: { text: `Attest hosting setup`, amendmentID, encoderkeys } })
      for (var i = 0, len = encoders_len; i < len; i++) {
        const encoderkey = await encoderkeys[i]
        const hosterkey = await hosterkeys[i]
        const id = amendmentID
        const topic1 = derive_topic({ senderKey: encoderkey, feedkey, receiverKey: attesterkey, id, log })
        const topic2 = derive_topic({ senderKey: attesterkey, feedkey, receiverKey: hosterkey, id, log }) 

        const unique_el = `${amendmentID}/${i}`
        const hosterSigningKey = hosterSigKeys[i]

        const opts = { 
          account, topic1, topic2, 
          encoderkey, hosterSigningKey, hosterkey, 
          unique_el, ranges, conn, log 
        }
        opts.compare_CB = (msg, key) => compare_encodings({ messages, key, msg, log })
        promises.push(verify_and_forward_encodings(opts))
      }
      
      const reponses = await Promise.all(promises) // can be 0 to 6 pubKeys of failed providers
      log({ type: 'attester', data: { text: `Resolved responses!`, reponses } })
      for (const res of reponses) {
        const { failedKeys: failed, proof_of_contact, hosterkey } = res
        failedKeys.push(...failed)
        sigs.push({ proof_of_contact, hosterkey })
      }
      log({ type: 'attester', data: { text: 'resolved responses', amendmentID, failedKeys, sigs_len: sigs.length } })
      const report = { failedKeys, sigs }        
      resolve(report)
    } catch(err) {
      log({ type: 'fail', data: { text: 'Error: attest_hosting_setup', err }})
      for (const key of encoderkeys) failedKeys.push(key.toString('hex'))
      for (const key of hosterkeys) failedKeys.push(key.toString('hex'))
      reject(err)
    }
  })
}
  
async function verify_and_forward_encodings (opts) {
  const { account, topic1, topic2, encoderkey, hosterSigningKey, hosterkey, unique_el, ranges, compare_CB, conn, log } = opts
  const failedKeys = []
  return new Promise(async (resolve, reject) => {
    try {
      // log({ type: 'attester', data: { text: 'calling connect_compare_send', encoderkey: encoderkey.toString('hex') }})
      const proof_of_contact = await connect_compare_send({
        account, topic1, topic2, ranges,
        key1: encoderkey, key2: hosterkey, 
        hosterSigningKey, unique_el, compare_CB, failedKeys, conn, log
      })
      log({ type: 'attester', data: { text: 'All compared and sent, resolving now', encoderkey: encoderkey.toString('hex'), proof_of_contact }})
      if (!proof_of_contact) failedKeys.push(hosterkey)
      resolve({ failedKeys, proof_of_contact, hosterkey })
    } catch (err) {
      log({ type: 'attester', data: { text: 'Error: verify_and_forward_encodings', hosterkey: hosterkey.toString('hex'), err }})
      failedKeys.push(encoderkey.toString('hex'), hosterkey.toString('hex'))
      reject({ failedKeys })
    }
  })
}

async function connect_compare_send (opts) {
  const { 
    account, topic1, topic2, ranges,
    key1, key2, hosterSigningKey, 
    unique_el, compare_CB, conn, failedKeys, log 
  } = opts
  const { hyper } = account
  const { count: expectedChunkCount } = getChunks(ranges)
  const log2encoder = log.sub(`<-Attester to encoder, me: ${account.noisePublicKey.toString('hex').substring(0,5)}, peer: ${key1.toString('hex').substring(0,5)}`)
  const log2hoster = log.sub(`<-Attester to hoster, me: ${account.noisePublicKey.toString('hex').substring(0,5)}, peer: ${key2.toString('hex').substring(0,5)}`)
  
  return new Promise(async (resolve, reject) => {       
    var feed1
    var feed2
    const compared = {}
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
        conn[remotestringkey] = 'connected'
        log2encoder({ type: 'attester', data: { text: 'Connected to the encoder', encoder: remotestringkey, expectedChunkCount, feedkey: feed.key.toString('hex') }})
        feed1 = feed
        for (var i = 0; i < expectedChunkCount; i++) {
          get_and_compare({ 
            compared, feed: feed1, i, done, compare_CB, 
            encoderkey: remotestringkey, expectedChunkCount, hosterFeed: feed2, failedKeys, log: log2encoder 
          }).catch(err => reject(err))
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
        conn[remotestringkey] = 'connected'
        log2hoster({ type: 'attester', data: { text: 'connected to the hoster', hoster: remotestringkey, topic: topic2.toString('hex'), compared, feedkey: feed.key.toString('hex') }})
        for (var i = 0; i < expectedChunkCount; i++ ) {
          try_send({ compared, i, feed: feed2, done, log: log2hoster,expectedChunkCount })
        }
      }
      
      async function done ({  type = undefined, proof = undefined, hkey = undefined }) { // hosting setup
        // called 2x: when all sentCount === expectedChunkCount and when hoster sends proof of contact
        const sentCount = compared['sentCount']
        log({ type: 'attester', data: { text: 'done called', proof, sentCount, expectedChunkCount }})
        if (proof) {
          const proof_buff = b4a.from(proof, 'hex')
          const data = b4a.from(unique_el, 'binary')
          if (!datdot_crypto.verify_signature(proof_buff, data, hosterSigningKey)) reject('not valid proof of contact')
          proof_of_contact = proof
        }          
        if (!proof_of_contact) {
          // done called for the first time (sentCount === expectedChunkCounts)
          await done_task_cleanup({ role: 'attester2encoder', topic: topic1, remotestringkey: key1.toString('hex'), state: account.state, log })
          return
        }
        if ((sentCount !== expectedChunkCount)) return
        log({ type: 'attester', data: { text: 'have proof and all data sent', proof, sentCount, expectedChunkCount }})
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
                        STORAGE CHALLENGE
---------------------------------------------------------------------- */
async function storageChallenge_handler (args) {
  const { event, chainAPI, account, signer, attesterkey, myAddress, hyper, log } = args
  const [storageChallengeID] = event.data
  const storageChallenge = await chainAPI.getStorageChallengeByID(storageChallengeID)
  const { attester: attesterID, checks } = storageChallenge
  const attesterAddress = await chainAPI.getUserAddress(attesterID)
  if (attesterAddress !== myAddress) return
  log({ type: 'chainEvent', data: `Attester ${attesterID}:  Event received: ${event.method} ${event.data.toString()}` })      
  const attestation = { response: { storageChallengeID, status: undefined, reports: [] },  signer }
  var conn // set to true once connection with hoster is established

  const data = await get_storage_challenge_data({ chainAPI, storageChallenge })
  
  
  const tid = setTimeout(async () => {
    log({ type: 'timeout', data: { texts: 'error: storage challenge - timeout', storageChallengeID } })
    const { hosterkey, feedkey_1 } = data
    const topic = derive_topic({ senderKey: hosterkey, feedkey: feedkey_1, receiverKey: attesterkey, id: storageChallengeID, log })
    done_task_cleanup({ role: 'storage_attester', topic, remotestringkey: hosterkey.toString('hex'), state: account.state, log })
    attestation.nonce = await account.getNonce()
    if (conn) attestation.response.status = 'no-data' // connection was established, but no data was sent
    else attestation.response.status = 'fail' //no connection was established between hoster and attester, reponse is empty
    await chainAPI.submitStorageChallenge(attestation)
    return
  }, DEFAULT_TIMEOUT)
  const res = await attest_storage_challenge({ data, account, conn, log }).catch(async err => {
    log({ type: 'storage challenge', data: { text: 'error: attest storage', storageChallengeID }})
    attestation.nonce = await account.getNonce()
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
    attestation.nonce = await account.getNonce()
    attestation.response.status = failed.length? 'failed' : 'success'
    attestation.response.proof_of_contact = proof_of_contact
    attestation.response.reports = reports
    await chainAPI.submitStorageChallenge(attestation)
  } else {
    log({ type: 'storage challenge', data: { text: 'error: no response', storageChallengeID }})
    attestation.nonce = await account.getNonce()
    await chainAPI.submitStorageChallenge(attestation)
  }
}
// connect to the hoster (get the feedkey, then start getting data)
// make a list of all checks (all feedkeys, amendmentIDs...)
// for each check, get data, verify and make a report => push report from each check into report_all
// when all checks are done, report to chain
async function attest_storage_challenge ({ data, account, conn, log: parent_log }) {
  return new Promise(async (resolve, reject) => {
    const { hyper } = account
    const { id, attesterkey, hosterkey, hosterSigningKey, checks, feedkey_1 } = data
    const logStorageChallenge = parent_log.sub(`<-attester2hoster storage challenge ${id}, me: ${account.noisePublicKey.toString('hex').substring(0,5)}, peer: ${hosterkey.toString('hex').substring(0,5)}`)
    var reports = []
    var proof_of_contact
    const verifying = [] 
    
    const topic = derive_topic({ senderKey: hosterkey, feedkey: feedkey_1, receiverKey: attesterkey, id, log: logStorageChallenge })
    await hyper.new_task({ newfeed: false, topic, log: logStorageChallenge })
    logStorageChallenge({ type: 'attestor', data: { text: `New task (storage challenge) added` } })

    await hyper.connect({ 
      swarm_opts: { role: 'storage_attester', topic, mode: { server: false, client: true } },
      targets: { targetList: [ hosterkey.toString('hex') ], msg: { receive: { type: 'feedkey' } } },
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
        logStorageChallenge({ type: 'attestor', data: { text: `Get storage data`, feedkey: feed.key.toString('hex') } })
        // get chunks from hoster for all the checks
        const expectedChunkCount = Object.keys(checks).length
        for (var i = 0; i < expectedChunkCount; i++) {
          const data_promise = feed.get(i)
          verifying.push(verify_stored_chunk(data_promise))
        }
        const settled = await Promise.allSettled(verifying)
        settled.forEach(res => {
          logStorageChallenge({ type: 'attestor', data: { text: `settled`, res: JSON.stringify(res) } })
          if (res.status === 'fulfilled') reports.push(res.value)
          if (res.status === 'rejected') reports.push('fail')
        })
        done({ type: 'got all data' })
      } catch (err) {
        logStorageChallenge({ type: 'error', data: [`error in get data: ${err}`] })
        reject(new Error('error in get data', { cause: 'no-data' }))
      }
    }

    function done ({ type = undefined, proof = undefined }) { // storage challenge
      // called 2x: when reports are ready and when hoster sends proof of contact
      logStorageChallenge({ type: 'attester', data: { text: 'done called for storage challenge', proof, reports, proof_of_contact }})
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
      logStorageChallenge({ type: 'attester', data: { text: 'have proof and all reports', proof_of_contact, reports_len: reports.length, checks_len: Object.keys(checks).length, hosterkey }})
      done_task_cleanup({ role: 'storage_attester', topic, remotestringkey: hosterkey.toString('hex'), state: account.state, log: logStorageChallenge })
      // doesn't need to send msg with type done, because it already sent ack-proof-of-contact
      resolve({ proof_of_contact, reports })
    }

    function verify_stored_chunk (data_promise) {
      return new Promise(async (resolve, reject) => {
        try {
          const chunk = await data_promise
          logStorageChallenge({ type: 'attester', data: { text: `Getting chunk`, chunk } })
          let { 
            contractID, index, encoded_data, encoded_data_signature, p 
          } = decode_stored_chunk(chunk) 
          logStorageChallenge({ type: 'attester', data: { text: `Storage proof received`, index, contractID, p } })
    
          const check = checks[`${contractID}`] // { index, feedkey, signatures, ranges, amendmentID, encoder_pos, encoderSigningKey }
          const { index: check_index, feedkey, signatures, ranges, encoderSigningKey, encoder_pos, amendmentID  } = check
          const unique_el = `${amendmentID}/${encoder_pos}`
    
          if (index !== check_index) reject(index)
          // 1. verify encoder signature
          if (!datdot_crypto.verify_signature(encoded_data_signature, encoded_data, encoderSigningKey)) {
            const err = new Error('not a valid chunk', { cause: 'invalid-chunk', contractID, index })
            reject(err)
          }
          logStorageChallenge({ type: 'attester', data: { text: `Encoder sig verified`, index, unique_el, contractID } })
    
          // 2. verify proof
          p = proof_codec.to_buffer(p)
          const proof_verified = await datdot_crypto.verify_proof(p, feedkey)
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

    // @NOTE:
    // attester receives: encoded data, nodes + encoded_data_signature
    // attester verifies signed event
    // attester verifies if chunk is signed by the original encoder (signature, encoder's pubkey, encoded chunk)
    // attester decompresses the chunk and takes out the original data (arr[1])
    // attester merkle verifies the data: (feedkey, root signature from the chain (published by attester after published plan)  )
    // attester sends to the chain: nodes, signature, hash of the data & signed event

async function get_storage_challenge_data ({ chainAPI, storageChallenge }) {
  const { id, checks, hoster: hosterID, attester: attesterID } = storageChallenge
  const contract_ids = Object.keys(checks).map(stringID => Number(stringID))
  const hosterSigningKey = await chainAPI.getSigningKey(hosterID)
  const hosterkey = await chainAPI.getHosterKey(hosterID)
  const attesterkey = await chainAPI.getAttesterKey(attesterID)
  var feedkey_1
  for (var i = 0, len = contract_ids.length; i < len; i++) {
    const contract_id = contract_ids[i]
    const { feed: feed_id, ranges, amendments } = await chainAPI.getContractByID(contract_id)
    const [encoderID, pos] = await getEncoderID({ chainAPI, amendments, hosterID })
    const { feedkey, signatures } = await chainAPI.getFeedByID(feed_id)
    if (!feedkey_1) feedkey_1 = feedkey

    checks[contract_id].feedkey = feedkey
    checks[contract_id].signatures = signatures
    checks[contract_id].ranges = ranges
    checks[contract_id].encoderSigningKey = await chainAPI.getSigningKey(encoderID)
    checks[contract_id].encoder_pos = pos
    checks[contract_id].amendmentID = amendments[amendments.length - 1]
    // checks[contract_id] = { index, feedkey, signatures, ranges, amendmentID, encoder_pos, encoderSigningKey }
  }
  return { id, attesterkey, hosterkey, hosterSigningKey, checks, feedkey_1 }
}

async function getEncoderID ({ chainAPI, amendments, hosterID }) {
  const active_amendment = await chainAPI.getAmendmentByID(amendments[amendments.length-1])
  const pos =  active_amendment.providers.hosters.indexOf(hosterID)
  const encoderID = active_amendment.providers.encoders[pos]
  return [encoderID, pos]
}

async function getAmendmentData ({ chainAPI, amendment, contract, log }) {
  const { encoders, hosters } = amendment.providers
  const keysPromises = []
  const sigKeysPromises = []
  hosters.forEach(id => {
    keysPromises.push(chainAPI.getHosterKey(id))
    sigKeysPromises.push(chainAPI.getSigningKey(id))
  })
  const encoderkeys = await Promise.all(encoders.map((id) => chainAPI.getEncoderKey(id)))
  const hosterkeys = await Promise.all(keysPromises)
  const hosterSigKeys = await Promise.all(sigKeysPromises)
  const { feed: feedID, ranges } = contract
  const feedkey = await chainAPI.getFeedKey(feedID)
  log({ type: 'attester', data: { text: `Got keys for hosting setup`, data: feedkey, providers: amendment.providers, encoderkeys, hosterkeys, ranges } })
  return { feedkey, encoderkeys, hosterSigKeys, hosterkeys, ranges }
}

/* ----------------------------------------------------------------------
                        PERFORMANCE CHALLENGE
---------------------------------------------------------------------- */

async function performanceChallenge_handler (args) {
  const { event, chainAPI, account, signer, myAddress, hyper, log } = args
  const [challengeID] = event.data
  const performanceChallenge = await chainAPI.getPerformanceChallengeByID(challengeID)
  const { attesters, feed: feedID, hosters: selectedHosters } = performanceChallenge
  const [attesterID] = attesters
  const attesterAddress = await chainAPI.getUserAddress(attesterID)
  if (attesterAddress !== myAddress) return
  log({ type: 'chainEvent', data: { text: 'new-performance-challenge', info: `Attester ${attesterID}:  Event received: ${event.method} ${event.data.toString()}` } })
  const feedObj = await chainAPI.getFeedByID(feedID)
  const { feedkey, contracts: contractIDs } = feedObj
  const topic = datdot_crypto.get_discoverykey(feedkey)
  log({ type: 'challenge', data: { text: 'Performance challenge for feed', feedObj } })
  const { hosterkeys, hosterIDs, chunks } = await get_challenge_data({ chainAPI, selectedHosters, contractIDs, log })
  
  var conns = {}
  var attesting = []
  var reports = {}
  var tids = {}

  const opts = { 
    account, chainAPI, hyper, challengeID, reports, 
    feedkey, topic, chunks, tids, conns, log 
  }

  for (var i = 0; i < hosterkeys.length; i++) {
    const hoster_id = hosterIDs[i]
    const hosterkey = hosterkeys[i]

    const htid = setTimeout(async () => {
      log({ type: 'timeout', data: { texts: `error: performance challenge - timeout for hoster ${hoster_id}`, challengeID } })
      done_task_cleanup({ role: 'performance_attester', topic, remotestringkey: hosterkey, state: account.state, log })
      reports[hoster_id] = { status: 'fail' } 
    }, DEFAULT_TIMEOUT)

    tids[hoster_id] = htid
    opts.hosterkey = hosterkey
    opts.hoster_id = hoster_id
    attesting.push(attest_performance(opts))
  }

  const tid = setTimeout(async () => {
    log({ type: 'timeout', data: { texts: 'error: performance challenge - timeout', challengeID, reports } })
    const nonce = await account.getNonce()
    await chainAPI.submitPerformanceChallenge({ challengeID, reports, signer, nonce })  
  }, DEFAULT_TIMEOUT)
  
  const settled = await Promise.allSettled(attesting)
  clearTimeout(tid)
  for (var i = 0; i < settled.length; i++) {
    log({ type: 'performance', data: { texts: 'promises settled', challengeID, settled_len: settled.length, reports } })
    const res = settled[i]
    const hoster_id = res.value
    if (res.status === 'rejected') reports[hoster_id] = { status: 'fail' }
    const remotestringkey = hosterkeys[i]
    done_task_cleanup({ role: 'performance_attester', topic, remotestringkey, state: account.state, log })
  }

    // TODO: send just a summary to the chain, not the whole array
  const nonce = await account.getNonce()
  await chainAPI.submitPerformanceChallenge({ challengeID, reports, signer, nonce })  
}

async function attest_performance (opts) {
  return new Promise(async (resolve, reject) => {
    const { 
      account, chainAPI, hyper, challengeID, 
      hosterkey, hoster_id, reports, feedkey,
      topic, chunks, tids, conns, log 
    } = opts

    try {
  
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
        log({ type: 'attester', data: { text: 'connected to the host for performance challenge', hoster: hosterkey }})
        conns[hoster_id] = true
        await feed.update()
        const to_check = chunks[hoster_id]
        const opts = { account, challengeID, feed, chunks: to_check, hosterkey, topic, log }
        const stats = await measure_performance(opts).catch(err => log({ type: 'fail', data: err })) || []
        reports[hoster_id] ? reports[hoster_id].stats = stats : reports[hoster_id] = { stats }
        done({ type: 'have the report' })
      }
      
      async function done ({ type = undefined, proof = undefined }) { // performance challenge
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
    } catch (err) {
      log({ text: 'error: attest_performance', hosterkey})
      reject(err)
    }
  })
}

// get all hosters and select random chunks to check for each hoster
async function get_challenge_data ({ chainAPI, selectedHosters, contractIDs, log }) {
  return new Promise (async(resolve, reject) => {
    try {
      const chunks = {}
      var hosterkeys = []
      const not_paused = []
      for (const contractID of contractIDs) {
        const { amendments, ranges } = await chainAPI.getContractByID(contractID)
        const active_amendment = await chainAPI.getAmendmentByID(amendments[amendments.length-1])
        var { providers: { hosters } } = active_amendment
        log({ type: 'challenge', data: { text: 'Getting hosters and chunks for contract', selectedHosters: JSON.stringify(selectedHosters) } })
        for (const hosterID of hosters) {
          if (!selectedHosters.includes(hosterID)) continue
          const hoster = await chainAPI.getUserByID(hosterID)
          const noisekey = b4a.from(hoster.noiseKey, 'hex')
          // console.log({ 'juhuhu': hoster, hosterkey: hoster.noiseKey.toString('hex') })
          if (hoster.status.paused) continue
          not_paused.push(hosterID)
          hosterkeys.push(noisekey.toString('hex'))
          const x = getRandomInt(0, ranges.length)
          log({ type: 'attester', data: { text: 'Selecting random range', ranges, x } })
          const random_range = ranges[x]
          chunks[hosterID] = { indexes: [] } // chain doesn't emit WHICH chunks attester should check
          chunks[hosterID].indexes.push(getRandomInt(random_range[0], random_range[1]))
        }
      }
      // when we have 2x same hoster - we check chunks from all contracts at once
      const hosterIDs = [...new Set(not_paused)]
      // const hosterkeysPromise = hosterIDs.map(async id => (await chainAPI.getHosterKey(id)).toString('hex'))
      // var hosterkeys = await Promise.all(hosterkeysPromise)
      hosterkeys = [...new Set(hosterkeys)]
      log({ type: 'performance challenge', data: { text: 'hosterkeys and chunks to test', not_paused, hosterIDs, selectedHosters, hosterkeys, chunks: JSON.stringify(chunks) } })
      resolve({ hosterkeys, hosterIDs, chunks })
    } catch (err) {
      log({ type: 'performance challenge', data: { text: 'Error in performance get_challenge_data', err: JSON.stringify(err) } })
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

/* ----------------------------------------------------------------------
                        UNPUBLISH PLAN
---------------------------------------------------------------------- */

async function unpublishPlan_handler (args) {
const { event, chainAPI, account, signer, attesterkey, myAddress, hyper, log } = args
const [planID] = event.data
// const jobIDs = unpublishedPlan_jobIDs(planID)
}
/* ----------------------------------------------------------------------
                        DROP HOSTING
---------------------------------------------------------------------- */

async function dropHosting_handler (args) {
  const { event, chainAPI, account, signer, attesterkey, myAddress, hyper, log } = args
  const [planID] = event.data
  // const jobIDs = unpublishedPlan_jobIDs(planID)
}

/* ----------------------------------------------------------------------
                        HOSTER REPLACEMENT
---------------------------------------------------------------------- */

async function hosterReplacement_handler (args) {
  const { event, chainAPI, account, signer, attesterkey, myAddress, hyper, log } = args
  const [amendmentID] = event.data
  const amendment = await chainAPI.getAmendmentByID(amendmentID)
  const { providers: { encoders, hosters, attesters }, pos, contract, ref } = amendment
  const { feed: feedID, ranges } = await chainAPI.getContractByID(contract)
  const feedkey = await chainAPI.getFeedKey(feedID)
  const [attesterID] = attesters
  const attesterAddress = await chainAPI.getUserAddress(attesterID)
  if (attesterAddress !== myAddress) return

  const { count: expectedChunkCount, chunks } = getChunks(ranges)
  var proof_of_contact
  const messages = {}
  const compare_CB = (msg, key) => compare_encodings({ messages, key, msg, log })
  const conn = {}
  const failedKeys = []
  var replacementHoster_topic
  var replacementEncoder_topic
  var replacementHosterkey
  var replacementEncoderkey
  const hosterSigningKey = await chainAPI.getSigningKey(hosters[pos])
  const compared = {}

  const tid = setTimeout(async () => {
    const hoster_promises = await Promise.all(hosters.map((id) => chainAPI.getHosterKey(id)))
    const encoderkey = await chainAPI.getEncoderKey(encoders[pos])
    const hosterkeys = await Promise.all(hoster_promises)
    const hosterstringkeys = hosterkeys.map(key => key.toString('hex'))
    const encoderstringkey = encoderkey.toString('hex')
    const peers = [...hosterstringkeys, encoderstringkey]
    log({ type: 'attester', data: { texts: 'error: hoster replacement - timeout', amendmentID, peers, conn: Object.keys(conn) } })
    const id = amendmentID
    for (const key of peers) {
      if (conn[key]) continue
      failedKeys.push(key.toString('hex'))
    }
    for (var i = 0; i < hosterstringkeys; i++) {
      const key = hosterstringkeys[i]
      if (i === pos) continue // we only call done task for active hoster & not for the replacement hoster
      const topic = derive_topic({ senderKey: attesterkey, feedkey, receiverKey: key, id, log }) 
      await done_task_cleanup({ role: 'attester2active_hoster', topic, remotestringkey:key, state: account.state, log })
    }
    const topic = derive_topic({ senderKey: encoderstringkey, feedkey, receiverKey: attesterkey, id, log })
    await done_task_cleanup({ role: 'attester2replacement_encoder', topic, remotestringkey: encoderstringkey, state: account.state, log })

    if (!failedKeys.length) failedKeys.push(...hosterstringkeys, encoderstringkey)
    log({ type: 'attester', data: { texts: 'hoster replacement timeout', amendmentID, failedKeys } })
    const report = { id: amendmentID, failed: failedKeys }
    const nonce = await account.getNonce()
    await chainAPI.hosterReplacementReport({ report, signer, nonce })
  }, DEFAULT_TIMEOUT)
  
  
  log({ type: 'attester', data: { text: `Attester ${attesterID}: Event received: ${event.method} ${event.data.toString()}`, amendment: JSON.stringify(amendment), attesterAddress, myAddress } })
  const data = { amendment, chainAPI, account, attesterkey, conn, failedKeys, signer, log }
  await replaceHoster(data).catch(err => {
    log({ type: 'replace hoster', data: { text: 'error: hosterReplacement', amendmentID }})
    return
  })

  // TODO: send report and proofs of successful hosterReplacement

  async function replaceHoster (data) {
    const { amendment, chainAPI, account, attesterkey, conn, failedKeys, signer, log } = data
    const { providers: { encoders, hosters }, contract, pos, id, ref } = amendment
    const hosterkeys_promise = hosters.map(hosterID => chainAPI.getHosterKey(hosterID))
    const hosterkeys = await Promise.all(hosterkeys_promise)
    replacementHosterkey = hosterkeys[pos]

    const { feed: feedID, ranges } = await chainAPI.getContractByID(contract)
    const feedkey = await chainAPI.getFeedKey(feedID)
    var hosterFeed
    const hostedDataVerified = []
    log({ type: 'attester', data: { text: `replace hoster`, amendmentID: id, hosterkeys } })    
    
    // from new encoder
    get_encoded_data({ 
      account, encoder_id: encoders[pos], feedkey, attesterkey, 
      id, ranges, compared, conn, failedKeys, log 
    })

    // from new encoder to replacement hoster
    send_encoded_data({ 
      amendmentID: id, replacementHosterkey, compared, feedkey,
      attesterkey, ranges, hosterFeed, log 
    })
    
    // from active hosters
    for (var i = 0; i < hosterkeys.length; i++) {
      if (i === pos) continue
      const hosterkey = hosterkeys[i]
      const encoderSigningKey = await chainAPI.getSigningKey(encoders[i])
      const unique_el = `${ref}/${i}`
      log({ type: 'attester', data: { text: `get data from active hoster`, amendmentID: id, i, pos,  hosterkey, hosterkeys } })    
      hostedDataVerified.push(get_hosted_data({ hosterkey, encoder_id: encoders[i], unique_el, feedkey, id, ranges, encoderSigningKey, log}))
    }
    
    // await Promise.all(hostedDataVerified)
    // log({ type: 'attester', data: { text: `All data sent to replacementHoster`, amendmentID: id } })  
    // const report = { id: amendmentID, failed: failedKeys }
    // const nonce = await account.getNonce()
    // await chainAPI.hosterReplacementReport({ report, signer, nonce })  
  }

  async function get_encoded_data (opts) {
    const { 
      account, encoder_id, feedkey, attesterkey, id, ranges, compared, conn, failedKeys, hosterFeed, log 
    } = opts
    const encoderkey = await chainAPI.getEncoderKey(encoder_id)
    const encoderstringkey = encoderkey.toString('hex')
    const log2enc = log.sub(`<-Attester to replacement encoder, me: ${account.noisePublicKey.toString('hex').substring(0,5)}, peer: ${encoderstringkey.substring(0,5)}`)
    const topic = derive_topic({ senderKey: encoderkey, feedkey, receiverKey: attesterkey, id, log })
    replacementEncoder_topic = topic
    
    log2enc({ type: 'attester', data: { text: 'load feed', encoder: encoderstringkey, topic: topic.toString('hex') }})
    await hyper.new_task({  newfeed: false, topic, log: log2enc })
    
    log2enc({ type: 'attester', data: { text: 'connect to replacement encoder', encoder: encoderstringkey }})

    await hyper.connect({ 
      swarm_opts: { role: 'attester2replacement_encoder', topic, mode: { server: false, client: true } }, 
      targets: { targetList: [encoderstringkey], msg: { receive: { type: 'feedkey' } } },
      onpeer: onencoder,
      log: log2enc
    })
    
    async function onencoder ({ feed, remotestringkey }) {
      conn[remotestringkey] = 'connected'
      replacementEncoderkey = remotestringkey
      log2enc({ type: 'attester', data: { text: 'Connected to the hoster replacement encoder' }})
      // log2enc({ type: 'attester', data: { text: 'Connected to the hoster replacement encoder', encoder: remotestringkey, expectedChunkCount, feedkey: feed.key.toString('hex'), feed_len: feed.length }})
      const chunks = []
      for (var i = 0; i < expectedChunkCount; i++) {
        get_and_compare({ 
          compared, feed, i, encoderkey: remotestringkey, hosterFeed,
          compare_CB, done, expectedChunkCount, failedKeys, log: log2enc 
        })
      }
      log2enc({ type: 'attester', data: { text: 'All chunks in hoster replacement sent to comparisson' }})
    }
  }

  async function send_encoded_data (data) {
    const { amendmentID, replacementHosterkey, compared, ranges, feedkey, attesterkey, log } = data
    const topic = derive_topic({ senderKey: attesterkey, feedkey, receiverKey: replacementHosterkey, id: amendmentID, log })
    replacementHoster_topic = topic
    const { feed } = await hyper.new_task({ topic, log })
    log({ type: 'attestor', data: { text: `New task (attester2replacement_hoster) added`, topic: topic.toString('hex') } })

    await hyper.connect({ 
      swarm_opts: { role: 'attester2replacement_hoster', topic, mode: { server: true, client: false } }, 
      targets: { feed, targetList: [replacementHosterkey.toString('hex')], msg: { send: { type: 'feedkey' } } } ,
      onpeer: onhoster,
      done,
      log
    })
    
    async function onhoster ({ feed, remotestringkey }) {
      conn[remotestringkey] = 'connected'
      hosterFeed = feed
      log({ type: 'attestor', data: { text: `Connected to the replacement hoster`, remotestringkey, amendmentID } })
      for (var i = 0; i < expectedChunkCount; i++ ) {
        try_send({ compared, i, feed: hosterFeed, done, log, expectedChunkCount })
      }
    }
  }

  async function get_hosted_data ({ hosterkey, encoder_id, unique_el, feedkey, id, ranges, encoderSigningKey, log }) {
    return new Promise (async (resolve, reject) => {
      const hosterstringkey = hosterkey.toString('hex')
      const log2hoster = log.sub(`<-Attester to replacement hoster, me: ${account.noisePublicKey.toString('hex').substring(0,5)}, peer: ${hosterstringkey.substring(0,5)}`)
      const topic = derive_topic({ senderKey: hosterkey, feedkey, receiverKey: attesterkey, id, log: log2hoster })
      await hyper.new_task({ newfeed: false, topic, log: log2hoster })
      log2hoster({ type: 'attestor', data: { text: `New task (attester2active_hoster) added` } })
  
      await hyper.connect({ 
        swarm_opts: { role: 'attester2active_hoster', topic, mode: { server: false, client: true } },
        targets: { targetList: [ hosterkey.toString('hex') ], msg: { receive: { type: 'feedkey' } } },
        onpeer: onhoster,
        done,
        log: log2hoster
      })
      
      async function onhoster ({ feed, remotestringkey }) {
        // for attester2active_hoster we have 2 tasks for same role and same topic
        // so we have to make sure not to run this 2x
        if (conn[remotestringkey]) return
        conn[remotestringkey] = 'connected'
        log2hoster({ type: 'attestor', data: { text: `Connected to the active hoster`, remotestringkey, amendment: id } })
        const opts = { 
          account, unique_el, encoder_id, chunks, feed, feedkey, expectedChunkCount, 
          encoderSigningKey, remotestringkey, topic, log: log2hoster 
        }
        await get_data(opts)
        await done_task_cleanup({ role: 'attester2active_hoster', topic, remotestringkey, state: account.state, log })
      }
    })
  }

  async function get_data (opts) {
    return new Promise (async (resolve, reject) => {
      const { 
        account, unique_el, encoder_id, chunks, feed, feedkey, expectedChunkCount, 
        encoderSigningKey, remotestringkey, topic, log 
      } = opts
      const verifying = []
      for (var i = 0; i < expectedChunkCount; i++) {
        const chunk_promise = feed.get(i)
        log({ type: 'attester', data: { text: 'chunk promise for replaceHoster received', i } })
        verifying.push(verify_chunk({ unique_el, feedkey, chunks, chunk_promise, encoderSigningKey, log }))
      }
      const settled = await Promise.allSettled(verifying)
      log({ type: 'attester', data: { text: 'settled in replaceHoster', settled } })
      settled.forEach(async res => {
        const { value: { chunk_promise }, status } = res
        if (status === 'fulfilled') {
          const json = await chunk_promise
          const chunk = decode_stored_chunk(json) 
          let { index }  = chunk
          const encoderkey = await chainAPI.getUserAddress(encoder_id)
          const response = await compare_CB(chunk_promise, encoderkey)
          log({ type: 'attester', data: { text: 'chunk for replaceHoster compared', index, response: response.type } })
          if (response.type !== 'verified') return reject('error: chunk not valid')
        }
      })
      resolve()
    })
  }

  async function verify_chunk ({ unique_el, feedkey, chunks, chunk_promise, encoderSigningKey, log }) {
    return new Promise (async (resolve, reject) => {
      try {
        const chunk = await chunk_promise
        let { 
          index, encoded_data, encoded_data_signature, p 
        } = decode_stored_chunk(chunk) 

        log({ type: 'attester', data: { text: `verifying chunk in replaceHoster`, encoded_data, index, chunks } })
        
        if (!chunks.includes(index)) return reject(index)
        
        // 1. verify encoder signature
        log({ type: 'attester', data: { text: `verifying encoder signature in replaceHoster for index ${index}`, unique_el, encoded_data_signature, encoded_data, encoderSigningKey } })
        if (!datdot_crypto.verify_signature(encoded_data_signature, encoded_data, encoderSigningKey)) {
          const err = new Error('not a valid chunk', { cause: 'invalid-chunk', index })
          log({ type: 'attester', data: { text: `verify_chunk error:`, err } })
          return reject(err)
        }
        log({ type: 'attester', data: { text: `Encoder sig in replaceHoster verified`, index } })
        
        // 2. verify proof
        p = proof_codec.to_buffer(p)
        // feedkey is not the feed.key, because this feed is not the original feed based on which proof is made
        log({ type: 'attester', data: { text: `verifying proof in replaceHoster`, index, feedkey, p } })
        const proof_verified = await datdot_crypto.verify_proof(p, feedkey)
        if (!proof_verified) {
          const err = new Error('not a valid p', { cause: 'invalid-p', index })
          log({ type: 'attester', data: { text: `verify_chunk error:`, err } })
          return reject(err)
        }
        log({ type: 'attester', data: { text: `Proof verified in replaceHoster`, index } })
        
        // 3. verify chunk (see if hash matches the proof node hash)
        const decompressed = await brotli.decompress(encoded_data)
        const decoded = parse_decompressed(decompressed, unique_el)
        if (!decoded) {
          log({ type: 'attester', data: { text: `verify_chunk error: parsing decompressed unsuccessful` } })
          return reject('parsing decompressed unsuccessful')
        }
        const block_verified = await datdot_crypto.verify_block(p, decoded)
        if (!block_verified) {
          log({ type: 'attester', data: { text: `verify_chunk error: chunk hash not valid` } })
          return reject('chunk hash not valid' )
        }
        log({ type: 'attester', data: { text: `Chunk hash verified in replaceHoster`, index, block_verified, chunk, decoded: decoded.toString('binary') } })
        resolve({ chunk_promise })
        // resolve({ chunk, decoded, p: proof_codec.to_string(p) })
      } catch (err) {
        reject('verify chunk failed')
        log({ type: 'attester', data: { text: `verify chunk failed for index`, err: JSON.stringify(err) } })
      }

    })
  }

  async function done ({  type = undefined, proof = undefined, hkey = undefined }) {
    // called 2x: when all sentCount === expectedChunkCount and when hoster sends proof of contact
    const unique_el = `${amendmentID}/${pos}` // unique el for proof of contact (for verifying hoster event sig)
    const sentCount = compared['sentCount']
    log({ type: 'attester', data: { text: 'done called', sentCount }})
    if (proof) {
      const proof_buff = b4a.from(proof, 'hex')
      const data = b4a.from(unique_el, 'binary')
      log({ type: 'attester', data: { text: 'got the proof in done', proof, proof_buff, data, hosterSigningKey }})
      if (!datdot_crypto.verify_signature(proof_buff, data, hosterSigningKey)) {
        log({ type: 'attester', data: { text: 'error: not a valid proof of contact' } })
        return
      }
      proof_of_contact = proof
    }          
    if (!proof_of_contact) {
      // done called for the first time (sentCount === expectedChunkCounts)
      await done_task_cleanup({ 
        role: 'attester2replacement_encoder', 
        topic: replacementEncoder_topic, 
        remotestringkey: replacementEncoderkey.toString('hex'), 
        state: account.state, 
        log 
      })
      return
    }
    if ((sentCount !== expectedChunkCount)) return
    log({ type: 'attester', data: { text: 'all sent to hoster in hoster replacement' }})
    clearTimeout(tid)
    await done_task_cleanup({ 
      role: 'attester2replacement_hoster', 
      topic: replacementHoster_topic, 
      remotestringkey: replacementHosterkey.toString('hex'), 
      state: account.state, 
      log 
    })
    const report = { id: amendmentID, failed: [] }
    const nonce = await account.getNonce()
    await chainAPI.hosterReplacementReport({ report, signer, nonce })
  }
  
}

/* -----------------------------------------
            PAUSED
----------------------------------------- */
async function paused_handler (args) {
  const { event, chainAPI, account, signer, myAddress, log } = args
  const [userID] = event.data
  const user = await chainAPI.getUserByID(userID)
  if (user.address === myAddress && user.status.paused) {
    log({ type: 'user', data: { text: `User ${user.id}: Event received: ${event.method} ${event.data.toString()}`} })
    // reset state
    // account.state.sockets = {}
    // account.state.feeds = {} 
    // account.state.targets = {} 
    // account.state.tasks = {}
    const nonce = await account.getNonce()
    await chainAPI.unpause({ signer, nonce })
  }
}

/* ----------------------------------------------------------------------
                  GENERAL HELPERS (candidates for components)
---------------------------------------------------------------------- */


function getRandomInt (min, max) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min)) + min // The maximum is exclusive and the minimum is inclusive
}

async function get_and_compare (opts) {
  return new Promise(async (resolve, reject) => {
    const { 
      compared, feed, i, compare_CB, done, hosterFeed,
      encoderkey, expectedChunkCount, failedKeys, log 
    } = opts
    log({ type: 'attester', data: { text: 'getting chunks', i, encoderkey } })
    try {
      const chunk_promise = feed.get(i)
      const chunk = await chunk_promise
      const res = await compare_CB(chunk_promise, encoderkey)
      log({ type: 'attester', data: { text: 'chunk compare res', i, res: res.type, /*chunk*/ } })
      if (res.type !== 'verified') { 
        log({ type: 'error', data: { text: 'error: chunk not valid' }}) 
        failedKeys.push(encoderkey)
        return reject()
      }
      try_send({ expectedChunkCount, compared, chunk, i, feed: hosterFeed, done, log })
      resolve()
    } catch(err) {
      log({ type: 'attester', data: { text: 'Error: get_and_compare_chunk' }})
      reject()
    }
  })
}

function try_send (opts) {
  let { compared, chunk, i, feed, done, expectedChunkCount, log } = opts
  var expectedCount
  log({ type: 'attester', data: { text: 'try send called', i , chunk, compared: JSON.stringify(compared) }})
  if (!compared['sentCount']) compared['sentCount'] = 0 
  if (!expectedCount && expectedChunkCount) expectedCount = expectedChunkCount
  if (chunk) { // got chunk in onencoder
    if (!compared[i]) {
      log({ type: 'attester', data: { text: 'chunk stored in compared', i , chunk, cb: compared[i]}})
      compared[i] = { chunk } 
    }
    else {
      compared[i].send_to_hoster(chunk)
      log({ type: 'attester', data: { text: 'call send_to_hoster cb', i , sentCount: compared['sentCount'], chunk, cb: compared[i]}})
      compared['sentCount']++
      delete compared[i]
    }
  }
  else { // onhoster
    if (compared[i]) {
      log({ type: 'attester', data: { text: 'try send', feedkey: feed.key.toString('hex') }})
      feed.append(compared[i].chunk)
      log({ type: 'attester', data: { text: 'chunk appended - onhoster', i, sentCount: compared['sentCount'], expectedChunkCount }})
      compared['sentCount']++
      delete compared[i]
    } else { 
      log({ type: 'attester', data: { text: 'add send_to_hoster cb to compared', i }})
      compared[i] = { send_to_hoster: (chunk) => { feed.append(chunk) } } 
    }
  }
  if (compared['sentCount'] === expectedCount) {
    log({ type: 'attester', data: { text: 'all sent', sentCount: compared['sentCount'], expectedCount }})
    done({ type: 'all sent' })
  }
} 

function decode_stored_chunk (chunk) {
  const json = chunk.toString()
  return proof_codec.decode(json)
}
