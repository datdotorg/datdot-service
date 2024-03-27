const derive_topic = require('derive-topic')
const download_range = require('_datdot-service-helpers/download-range')
const brotli = require('_datdot-service-helpers/brotli')
const parse_decompressed = require('_datdot-service-helpers/parse-decompressed')
const hosterStorage = require('hoster-storage')
const sub = require('subleveldown')
const b4a = require('b4a')
const { done_task_cleanup } = require('_datdot-service-helpers/done-task-cleanup')

const datdot_crypto = require('datdot-crypto')
const proof_codec = require('datdot-codec/proof')

const getChunks = require('getChunks')

const DEFAULT_TIMEOUT = 10000 // has to be high

module.exports = APIS => { 
  return hoster

  async function hoster(vaultAPI) {
    const account = vaultAPI
    const { identity, log, hyper } = account
    const { chainAPI } = APIS
    const { myAddress, signer, noiseKey: hosterkey } = identity
    await chainAPI.listenToEvents(handleEvent)

    // EVENTS
    async function handleEvent(event) {
      const args = { event, chainAPI, account, signer, hosterkey, myAddress, hyper, log }
      const method = event.method
      if (method === 'hostingSetup' || method === 'retry_hostingSetup') handle_hostingSetup(args)
      else if (method === 'HostingStarted') {}
      else if (method === 'hostingSetup_failed') handle_hostingSetup_failed(args)
      else if (method === 'hosterReplacement') handle_hosterReplacement(args)
      else if (method === 'dropHosting') handle_dropHosting(args)
      else if (method === 'storageChallenge') handle_storageChallenge(args)
      // paused handled in attester
    }
  }
}

/* -----------------------------------------
            HOSTING SETUP FAILED
----------------------------------------- */

async function handle_hostingSetup_failed (args) {
  const { event, chainAPI, account, signer, encoderkey, myAddress, hyper, log } = args
  const [amendmentID] = event.data  
  const amendment = await chainAPI.getAmendmentByID(amendmentID)
  const { contract: contractID, providers: { hosters } } = amendment
  var isForMe
  for (const id of hosters) {
    const address = await chainAPI.getUserAddress(id)
    if (address === myAddress) isForMe = true  
  }

  if (!isForMe) return
  
  log({ type: 'hoster', data: { text: `Event received: ${event.method} ${event.data.toString()}` }})   
  const contract = await chainAPI.getContractByID(contractID)
  const { ranges, feed: feedID } = contract
  const { feedkey } = await chainAPI.getFeedByID(feedID)
  const { tasks, feeds } = account.state

  const topic = datdot_crypto.get_discoverykey(feedkey)
  const stringtopic = topic.toString('hex')
  if (!tasks[stringtopic]) return
  if (!tasks[stringtopic].amendments?.[amendmentID]) return
  const peers = tasks[stringtopic].amendments[amendmentID].peers
  if (!peers.length) return
  delete tasks[stringtopic].amendments[amendmentID]
  await done_task_cleanup({ role: 'hoster2author', topic, peers, state: account.state, log }) // done for hoster2author (client)
  // remove feed from storage
  const hasKey = await account.storages.has(feedkey.toString('hex'))
  if (!feeds[stringtopic] && hasKey) {
    await removeFeed({ account, key: feedkey, amendmentID, log })
  }
  // else if (hasKey) {
  //   // deleteDecoded and deleteEncoded ranges if stored in the DB
  // }
}


/* ----------------------------------------------------------------------------------- 

      HOSTING SETUP / GET ENCODED DATA AND START HOSTING

--------------------------------------------------------------------------------------- */

async function handle_hostingSetup (args) {
  const { event, chainAPI, account, hosterkey, myAddress, hyper, log } = args
  const [amendmentID] = event.data
  const amendment = await chainAPI.getAmendmentByID(amendmentID)
  const { hosters, attesters, encoders } = amendment.providers
  const pos = await isForMe({ IDs: hosters, myAddress, chainAPI, log })
  if (pos === undefined) return // pos can be 0
  var peers = []

  const { feedkey, attesterkey, plan, ranges, signatures } = await getAmendmentData(attesters, amendment)

  const tid = setTimeout(() => {
    log({ type: 'hoster', data: { texts: 'error: hosting setup - timeout', amendmentID } })
    return
  }, DEFAULT_TIMEOUT)

  log({ type: 'hoster', data: { text: `Event received: ${event.method} ${event.data.toString()}` } })
  const encoderSigningKey = await chainAPI.getSigningKey(encoders[pos])
  const data = {
    hyper, amendmentID, account, feedkey,
    encoderSigningKey, hosterkey, attesterkey,
    plan, ranges, encoder_pos: pos, peers, log
  }
  const { feed } = await receive_data_and_start_hosting(data).catch(err => {
    log({ type: 'hosting setup', data: { text: 'error: hosting setup', amendmentID }})
  })
  clearTimeout(tid)
  log({ type: 'hoster', data: {  text: `Hosting for the amendment ${amendmentID} started`, feedkey: feed.key.toString('hex') } })

  async function getAmendmentData(attesters, amendment) {
    const contract = await chainAPI.getContractByID(amendment.contract)
    const { ranges, feed: feedID } = contract
    const [attesterID] = attesters
    const attesterkey = await chainAPI.getAttesterKey(attesterID)
    const { feedkey, signatures } = await chainAPI.getFeedByID(feedID)
    const objArr = ranges.map(range => ({ start: range[0], end: range[1] }))
    const plan = { ranges: objArr }
    return { feedkey, attesterkey, plan, ranges, signatures }
  }
}


/* ------------------------------------------- 
              
                STORAGE CHALLENGE

-------------------------------------------- */


async function handle_storageChallenge (args) {
  const { event, chainAPI, account, hosterkey, myAddress, hyper, log } = args
  const [id] = event.data
  const storageChallenge = await chainAPI.getStorageChallengeByID(id)
  const hosterID = storageChallenge.hoster
  const hosterAddress = await chainAPI.getUserAddress(hosterID)
  if (hosterAddress !== myAddress) return
  log({ type: 'hoster', data: { text: `Hoster ${hosterID}:  Event received: ${event.method} ${event.data.toString()}` } })
  const controller = new AbortController()
  const tid = setTimeout(() => {
    log({ type: 'timeout', data: { texts: 'error: storage challenge - timeout', id } })
    return
  }, DEFAULT_TIMEOUT)

  const data = await get_storage_challenge_data(storageChallenge)
  data.tid = tid
  await send_storage_proofs_to_attester({ data, account, log }).catch(err => {
    log({ type: 'storage challenge', data: { text: 'error: provide storage proof', id }})
  })
  clearTimeout(tid)
  log({ type: 'hoster', data: { text: `sendStorageChallengeToAttester completed` } })

  async function get_storage_challenge_data (storageChallenge) {
    const { id: challenge_id, checks, hoster: hosterID, attester: attesterID } = storageChallenge
    const contract_ids = Object.keys(checks).map(string_id => Number(string_id))
    const hosterkey = await chainAPI.getHosterKey(hosterID)
    const attesterkey = await chainAPI.getAttesterKey(attesterID)
    var feedkey_1
    for (const id of contract_ids) {
      const { feed: feedID, ranges, amendments } = await chainAPI.getContractByID(id)
      const [encoderID, pos] = await getEncoderID(amendments, hosterID)
      const { feedkey, signatures }  = await chainAPI.getFeedByID(feedID)
      if (!feedkey_1) feedkey_1 = feedkey
      checks[id].feedkey = feedkey
      // checks[id] = { index, feedkey }
    }
    return { challenge_id, attesterkey, hosterkey, checks, feedkey_1 }
  }

  async function getEncoderID (amendments, hosterID) {
    const active_amendment = await chainAPI.getAmendmentByID(amendments[amendments.length-1])
    const pos =  active_amendment.providers.hosters.indexOf(hosterID)
    const encoderID = active_amendment.providers.encoders[pos]
    return [encoderID, pos]
  }

}

async function send_storage_proofs_to_attester({ data, account, log: parent_log }) {
  return new Promise(async (resolve, reject) => {
    const { hyper } = account
    const { challenge_id, attesterkey, hosterkey, checks, feedkey_1, tid } = data
    
    const log = parent_log.sub(`<-hoster2attester storage challenge, me: ${account.noisePublicKey.toString('hex').substring(0,5)} peer: ${attesterkey.toString('hex').substring(0, 5)} `)
    
    const topic = derive_topic({ senderKey: hosterkey, feedkey: feedkey_1, receiverKey: attesterkey, id: challenge_id, log })
    const { feed } = await hyper.new_task({ topic, log })
    log({ type: 'hoster', data: { text: `New task added (storage hoster)` } })
    
    
    await hyper.connect({ 
      swarm_opts: { role: 'storage_hoster', topic, mode: { server: true, client: false } },
      targets: { feed, targetList: [ attesterkey.toString('hex') ], msg: { send: { type: 'feedkey' } } },
      onpeer: onattester,
      done,
      log
    })
    
    async function onattester ({ feed, remotestringkey }) {
      log({ type: 'hoster', data: { text: `Connected to the storage chalenge attester`, feedkey: feed.key.toString('hex') } })
      try {
        const appended = []
        const contract_ids = Object.keys(checks).map(stringID => Number(stringID))
        for (var i = 0; i < contract_ids.length; i++) {
          const contractID = contract_ids[i]
          const { index, feedkey } = checks[contractID]
          log({ type: 'hoster', data: { text: 'Next check', check: checks[contractID], contractID, checks} })
          const message = await getDataFromStorage(account, feedkey, index, log)
          if (!message) return
          message.type = 'proof'
          message.contractID = contractID
          message.p = message.p.toString()
          message.p = message.p.toString('binary')
          log({ type: 'hoster', data: { text: `Storage proof: appending chunk ${i} for index ${index}` } })
          appended.push(send({ feed, message, log }))
        }
        await Promise.all(appended)
        send_proof_of_contact({ 
          account, 
          unique_el: `${challenge_id}`, 
          remotestringkey: attesterkey.toString('hex'), 
          topic, 
          log 
        })
        log({ type: 'hoster', data: { text: `${appended.length} appended to the attester` } })
        resolve()
      } catch (err) {
        log({ type: 'error', data: { text: `Error: ${err}` } })
        clearTimeout(tid)
        reject(err)
      }
    }
    async function done ({ type }) {
      if (type !== 'done') return
      const remotestringkey = attesterkey.toString('hex')
      await done_task_cleanup({ role: 'storage_hoster', topic, remotestringkey, state: account.state, log })
    }
  })
  
}

/* ------------------------------------------- 
    
            HANDLE DROP HOSTING

-------------------------------------------- */
async function handle_dropHosting (args) {
  const { event, chainAPI, account, hosterkey, myAddress, hyper, log } = args
  const [amendmentID, hosterID] = event.data
  const hosterAddress = await chainAPI.getUserAddress(hosterID)
  if (hosterAddress !== myAddress) return
  log({ type: 'hoster', data: {  text: `Hoster ${hosterID}:  Event received: ${event.method} ${event.data.toString()}` } })
  
  const { 
    providers, contract: contractID, id
  } = await chainAPI.getAmendmentByID(amendmentID)
   const { feed: feedID, ranges } = await chainAPI.getContractByID(contractID)
   const feedkey = await chainAPI.getFeedKey(feedID)
   const stringkey = feedkey.toString('hex')
   const topic = datdot_crypto.get_discoverykey(feedkey)
   const stringtopic = topic.toString('hex')
   const { tasks } = account.state
  // call done task cleanup
  for (const stringtopic of Object.keys(tasks)) {
    if (!tasks[stringtopic] !== topic.toString('hex')) continue
    await done_task_cleanup({ role: 'hoster', topic, peers: [], state: account.state, log })
  }
  // remove feed from storage
  if (account.state.feeds[stringtopic][feedkey]) return
  if (account.state.feeds[stringtopic][stringkey]) return
  const hasKey = await account.storages.has(feedkey.toString('hex'))
  if (hasKey) return await removeFeed({ account, key: feedkey, amendmentID, log })

}

/* ------------------------------------------- 
    
            HANDLE HOSTER REPLACEMENT

-------------------------------------------- */
async function handle_hosterReplacement (args) {
  const { event, chainAPI, account, hosterkey, myAddress, hyper, log } = args
  const [amendmentID] = event.data
  const { providers: { hosters, attesters, encoders }, pos, contract, id
  } = await chainAPI.getAmendmentByID(amendmentID)
  const [attesterID] = attesters
  const attesterkey = await chainAPI.getAttesterKey(attesterID)
  const { feed: feedID, ranges } = await chainAPI.getContractByID(contract)
  const feedkey = await chainAPI.getFeedKey(feedID)
  const addresses_promise = hosters.map(async hosterID => chainAPI.getUserAddress(hosterID))
  const addresses = await Promise.all(addresses_promise)
  const len = addresses.length
  const peers = []

  const tid = setTimeout(() => {
    log({ type: 'timeout', data: { texts: 'error: hoster replacement - timeout', id } })
    return
  }, DEFAULT_TIMEOUT)

  for (var i = 0; i < len; i++) {
    const hosterAddress = addresses[i]
    if (hosterAddress !== myAddress) continue
    if (i === pos) {
      log({ type: 'hoster', data: { type: `Event received: ${event.method} ${event.data.toString()}`, role: 'replacementHoster' } })   
      const objArr = ranges.map(range => ({ start: range[0], end: range[1] }))
      const plan = { ranges: objArr }
      const encoderSigningKey = await chainAPI.getSigningKey(encoders[pos])
      const data = {
        hyper, amendmentID, account, feedkey,
        encoderSigningKey, hosterkey, attesterkey,
        plan, ranges, encoder_pos: pos, peers,log
      }
      const { feed } = await receive_data_and_start_hosting(data).catch(err => {
        log({ type: 'hosting setup', data: { text: 'error: hosting setup', amendmentID }})
      })
    } else {
      log({ type: 'hoster', data: { type: `Event received: ${event.method} ${event.data.toString()}`, role: 'activeHoster' } })   
      const opts = { hyper, account, hosterkey, attesterkey, feedkey, ranges, id, tid, log }
      send_data_to_attester(opts)
    }
  }
  clearTimeout(tid)
}

async function send_data_to_attester (opts) {
  return new Promise (async (resolve, reject) => {
    const { account, hyper, hosterkey, attesterkey, feedkey, ranges, id, tid, log } = opts
    const topic = derive_topic({ senderKey: hosterkey, feedkey, receiverKey: attesterkey, id, log })
    const { feed } = await hyper.new_task({ topic, log })
    log({ type: 'hoster', data: { text: `New task added (active hoster)` } })
  
    await hyper.connect({ 
      swarm_opts: { role: 'active_hoster2attester', topic, mode: { server: true, client: false } },
      targets: { feed, targetList: [ attesterkey.toString('hex') ], msg: { send: { type: 'feedkey' } } },
      onpeer: onattester,
      done,
      log
    })
  
    async function onattester ({ feed: attester_feed, remotestringkey }) {
      log({ type: 'hoster', data: { text: `Connected to the attester to send data for hoster replacement`, feedkey: attester_feed.key.toString('hex') } })
      try {
        const { count: expectedChunkCount, chunks } = getChunks(ranges)
        const appended = []
        for (const index of chunks) {
          log({ type: 'hoster', data: { text: 'Next check in hosterReplacement', index, feedkey, chunks} })
          const message = await getDataFromStorage(account, feedkey, index, log)
          if (!message) return
          message.type = 'proof'
          // message.contractID = contractID
          message.p = message.p.toString()
          message.p = message.p.toString('binary')
          log({ type: 'hoster', data: { text: `Hoster replacement: appending chunk ${index}` } })
          appended.push(send({ feed, message, log }))
        }
        await Promise.all(appended)
        log({ type: 'hoster', data: { text: `${appended.length} appended to the attester` } })
        resolve()
      } catch (err) {
        log({ type: 'error', data: { text: `Error: ${err}` } })
        clearTimeout(tid)
        reject(err)
      }
    }
    async function done ({ type }) {
      if (type !== 'done') return
      const remotestringkey = attesterkey.toString('hex')
      await done_task_cleanup({ role: 'active_hoster2attester', topic, remotestringkey, state: account.state, log })
    }
  })
}

            
/* ------------------------------------------- 
    
            HELPERS

-------------------------------------------- */

async function isForMe({ IDs, myAddress, chainAPI, log }) {
  log({ type: 'hoster', data: {  text: 'Is for me', IDs } })
  for (var i = 0, len = IDs.length; i < len; i++) {
    const id = IDs[i]
    const peerAddress = await chainAPI.getUserAddress(id)
    if (peerAddress === myAddress) return i
  }
}

async function send_proof_of_contact ({ account, unique_el, remotestringkey, topic, log }) {
  try {
    const data = b4a.from(unique_el, 'binary')
    const proof_of_contact = account.sign(data)
    const channel = account.state.sockets[remotestringkey].channel
    const stringtopic = topic.toString('hex')
    const string_msg = channel.messages[0]
    string_msg.send(JSON.stringify({ type: 'proof-of-contact', stringtopic, proof_of_contact: proof_of_contact.toString('hex') }))
  } catch (err) {
    log({ type: 'Error', data: {  text: 'Error: send_proof_of_contact', err } })
    return reject('sending proof of contact failed')
  }
}

function send ({ feed, message, log }) {
  return new Promise(async (resolve, reject) => {
    await feed.append(proof_codec.encode(message))
    resolve()
  })
}

async function receive_data_and_start_hosting (data) {
  return new Promise (async (resolve,reject) => {
    const { hyper, amendmentID, account, feedkey, plan, ranges, peers, log } = data  
    try {
      await addKey(account, feedkey, plan)
      const log2Author = log.sub(`Hoster to author, me: ${account.noisePublicKey.toString('hex').substring(0,5)} `)
      log({ type: 'hoster', data: { text: 'load feed', amendment: amendmentID } })
      const { feed } = await loadFeedData({ peers, account, hyper, ranges, feedkey, amendmentID, log: log2Author })
      await getEncodedDataFromAttester(data)
      resolve({ feed })
    } catch (err) {
      log({ type: 'Error', data: {  text: 'Error: receive_data_and_start_hosting', err } })
      reject(err)
    }
  })
}

async function saveKeys(account, keys) {
  await account.hosterDB.put('all_keys', JSON.stringify(keys))
}

async function addKey(account, key, options) {
  const stringKey = key.toString('hex')
  var existing = (await account.hosterDB.get('all_keys').catch(e => { })) || '[]'
  existing = JSON.parse(existing)
  const data = { key: stringKey, options }
  const final = existing.concat(data)
  await saveKeys(account, final)
}

async function loadFeedData({ peers, account, hyper, ranges, feedkey, amendmentID, log }) {
  return new Promise (async (resolve,reject) => {
    const topic = datdot_crypto.get_discoverykey(feedkey)
    const stringtopic = topic.toString('hex')
    const { feed } = await hyper.new_task({ feedkey, topic, log })
    try {
      // replicate feed from author
      await hyper.connect({ 
        swarm_opts: { role: 'hoster2author', topic, mode: { server: true, client: true } }, 
        done,
        onpeer,
        log
      })

      function onpeer ({ peerkey }) {
        log({ type: 'hoster', data: { text: `onpeer callback`, stringtopic, peerkey } })
        peers.push(peerkey.toString('hex'))
        // const { tasks } = account.state
        // if (!tasks[stringtopic].amendments) {
        //   tasks[stringtopic].amendments = { [amendmentID]: { peers: [peerkey.toString('hex')]} }
        // } else {
        //   if (tasks[stringtopic].amendments[amendmentID]) tasks[stringtopic].amendments[amendmentID].peers.push(peerkey.toString('hex'))
        //   else tasks[stringtopic].amendments[amendmentID] = { peers: [peerkey.toString('hex')]}
        // }
      }
      
      var stringkey = feed.key.toString('hex')
      var storage
      log({ type: 'hoster', data: { text: `load feed`, stringkey } })
      if (!account.storages.has(stringkey)) {
        log({ type: 'hoster', data: { text: `New storage for feed`, stringkey } })
        const db = sub(account.db, stringkey, { valueEncoding: 'binary' })
        storage = new hosterStorage({ db, feed, log }) // comes with interecepting the feeds
        account.storages.set(stringkey, storage)
      } else storage = await getStorage({account, key: feed.key, log})
    
      // make hoster-storage for feed
      let downloaded = []
      for (const range of ranges) { downloaded.push(download_range({ feed, range })) }
      await Promise.all(downloaded)
      peers = [...new Set(peers)]
      log({ type: 'hoster', data: {  text: 'all ranges downloaded', ranges, peers } }) 
      // delete account.state.tasks[stringtopic].amendments[amendmentID]
      await done_task_cleanup({ role: 'hoster2author', topic, peers, state: account.state, log }) // done for hoster2author (client)
      peers = []
      resolve({ feed })

      async function done ({ role, stringtopic, peerkey }) {
        const { tasks } = account.state
        // triggered by clients for: hoster2author (server) in hosting setup & hoster (server)
        log({ type: 'hoster', data: { text: `calling done`, role, stringtopic, peerkey } })
        await done_task_cleanup({ role, topic, peers: [peerkey], state: account.state, log })                   
      }
    } catch (err) {
      log({ type: 'Error', data: {  text: 'Error: loading feed data', err } })
      reject(err)
    }
  }) 
}

async function getEncodedDataFromAttester(data) {
  const { 
    hyper, amendmentID, account, hosterkey,
    encoderSigningKey, feedkey, attesterkey,
    ranges, encoder_pos, log
  } = data 
  const { count: expectedChunkCount, chunks } = getChunks(ranges)
  const log2attester = log.sub(`hoster to attester, me: ${account.noisePublicKey.toString('hex').substring(0,5)}, peer: ${attesterkey.toString('hex').substring(0,5)} amendment ${amendmentID}`)
  const remotestringkey = attesterkey.toString('hex')
  const unique_el = `${amendmentID}/${encoder_pos}`
  const topic = derive_topic({ senderKey: attesterkey, feedkey, receiverKey: hosterkey, id: amendmentID, log })
  let counter = 0

  return new Promise(async (resolve, reject) => {
    await hyper.new_task({ newfeed: false, topic, log: log2attester })
    try {
      // hoster to attester in hosting setup
      log2attester({ type: 'hoster', data: { text: `load feed`, attester: remotestringkey } })
      await hyper.connect({
        swarm_opts: { role: 'hoster2attester', topic, mode: { server: false, client: true } },
        targets: { targetList: [remotestringkey], msg: { receive: { type: 'feedkey' }} },
        onpeer: onattester,
        done,
        log: log2attester
      })
      async function onattester ({ feed }) {
        log2attester({ type: 'hoster', data: { text: `Connected to the attester`, chunks } })
        const all = []
        for (var i = 0; i < expectedChunkCount; i++) all.push(store_data(feed.get(i)))
        try {
          const results = await Promise.all(all)
          log2attester({ type: 'hoster', data: { text: `All chunks hosted`, len: results.length, expectedChunkCount } })
          await send_proof_of_contact({ account, unique_el, remotestringkey, topic, log })
          return resolve()
        } catch (err) {
          log({ type: 'error', data: { text: `Error getting results` } })
          return reject(new Error({ type: 'fail', data: 'Error storing data' }))
        }
      }
      async function done ({ type }) {
        await done_task_cleanup({ role: 'hoster2attester', topic, remotestringkey, state: account.state, log: log2attester })
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
      log2attester({ type: 'hoster', data: { text: `Got index: ${data.index}`, expectedChunkCount, ranges } })
      try { 
        // TODO: Fix up the JSON serialization by converting things to buffers
        const hasStorage = await account.storages.has(feedkey.toString('hex'))
        if (!hasStorage) { 
          log2attester({ type: 'hoster', data: { text: `error: Unknown feed`,  key: feedkey.toString('hex') } })
          return reject({ type: 'Error', error: 'UNKNOWN_FEED', ...{ key: feedkey.toString('hex') } }) 
        }
        // 1. verify encoder signature
        if (!datdot_crypto.verify_signature(encoded_data_signature, encoded_data, encoderSigningKey)) reject(index)
        // 2. verify proof
        p = proof_codec.to_buffer(p)
        const proof_verified = await datdot_crypto.verify_proof(p, feedkey)
        if (!proof_verified) return reject('not a valid proof')
        // 3. verify chunk (see if hash matches the proof node hash)
        const decompressed = await brotli.decompress(encoded_data)
        const decoded = parse_decompressed(decompressed, unique_el)
        const block_verified = await datdot_crypto.verify_block(p, decoded)
        if (!block_verified) return reject('not a valid chunk hash')
        
        await store_in_hoster_storage({ // need to store unique_el, to be able to decompress and serve chunks as hosters
          account, feedkey, index, encoded_data_signature,
          encoded_data, unique_el, p, log: log2attester
        })
        counter++
        log2attester({ type: 'hoster', data: { text: `stored index: ${index} (${counter}/${expectedChunkCount})` } })
        return resolve({ type: 'encoded:stored', ok: true, index: data.index })
      } catch (e) {
        const error = { type: 'encoded:error', error: `ERROR_STORING: ${e}`, data }
        log2attester({ type: 'error', data: { text: `Error: ${JSON.stringify(error)}` } })
        return reject(error)
      }
    })
  }
}

async function removeKey({ account, key, log }) {
  log({ type: 'hoster', data: { text: `Removing the key` } })
  const stringKey = key.toString('hex')
  var existing = (await account.hosterDB.get('all_keys').catch(e => { })) || '[]'
  existing = JSON.parse(existing)
  const final = existing.filter((data) => data.key !== stringKey)
  await saveKeys(account, final)
  log({ type: 'hoster', data: { text: `Key removed` } })
}
async function removeFeed({ account, key, log }) {
  log({ type: 'hoster', data: { text: `Removing the feed` } })
  const stringKey = key.toString('hex')
  const storage = await getStorage({account, key, log})
  if (storage) account.storages.delete(stringKey)
  await removeKey({ account, key, log })
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

async function getStorage ({account, key, log}) {
  const stringkey = key.toString('hex')
  const storage = await account.storages.get(stringkey)
  log({ type: 'hoster', data: { text: `Existing storage`, stringkey } })
  return storage
}

async function store_in_hoster_storage(opts) {
  const { 
    account, feedkey, index, encoded_data_signature, 
    encoded_data, unique_el, p, log 
  } = opts
  const storage = await getStorage({account, key: feedkey, log})
  return storage.storeEncoded({
    index, encoded_data_signature, encoded_data, unique_el, p
  })
}

async function getDataFromStorage(account, key, index, log) {
  const storage = await getStorage({account, key, log})
  log({ type: 'hoster', data: { text: 'Got the storage', key, index }})
  const data = await storage.getProofOfStorage(index)
  log({ type: 'hoster', data: { text: 'Got encoded data from storage', key, index, data }})
  return data
}
