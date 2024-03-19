const derive_topic = require('derive-topic')
const {done_task_cleanup} = require('_datdot-service-helpers/done-task-cleanup')
const proof_codec = require('datdot-codec/proof')
const brotli = require('_datdot-service-helpers/brotli')
const serialize_before_compress = require('serialize-before-compress')
const datdot_crypto = require('datdot-crypto')
const cloneDeep = require('clone-deep')
const DEFAULT_TIMEOUT = 10000

module.exports = APIS => {
  return encoder 
  
  async function encoder (vaultAPI) {
    const account = vaultAPI
    const { identity, log, hyper } = account
    const { chainAPI } = APIS
    const { myAddress, signer, noiseKey: encoderkey } = identity
    await chainAPI.listenToEvents(handleEvent)
    
    // EVENTS
    async function handleEvent (event) {
      const args = { event, chainAPI, account, encoderkey, signer, myAddress, log }
      const method = event.method
      if (method === 'hostingSetup' || method === 'retry_hostingSetup') handle_hostingSetup(args)
      else if (method === 'hosterReplacement') handle_hosterReplacement(args)
      else if (method === 'hostingSetup_failed') handle_hostingSetup_failed(args)
      else if (method === 'hostingStarted') {}
      // paused handled in attester
    }
  }
} 

/* -----------------------------------------
            HOSTING SETUP
----------------------------------------- */
async function handle_hostingSetup (args) {
  const { event, chainAPI, account, encoderkey, myAddress, log } = args
  const [amendmentID] = event.data
  const amendment = await chainAPI.getAmendmentByID(amendmentID)
  var encoder_pos = await includesMe({ IDs: amendment.providers.encoders, myAddress, chainAPI, log })
  if (encoder_pos === undefined) return // pos can be 0

  const tid = setTimeout(() => {
    log({ type: 'timeout', data: { texts: 'error: encoding timeout', amendmentID } })
  }, DEFAULT_TIMEOUT)

  log({ type: 'encoder', data: [`Event received: ${event.method} ${event.data.toString()}`] })   
  const data = { account, amendment, chainAPI, encoderkey, encoder_pos, log }
  await encode_hosting_setup(data).catch(err => {
    log({ type: 'hosting setup', data: { text: 'error: encode', amendmentID }})
    return
  })
  clearTimeout(tid)
  log({ type: 'encoder', data: { type: `Encoding done` } })

}

/* -----------------------------------------
            HOSTING SETUP FAILED
----------------------------------------- */

async function handle_hostingSetup_failed (args) {
  const { event, chainAPI, account, signer, encoderkey, myAddress, hyper, log } = args
  const [amendmentID] = event.data  
  const amendment = await chainAPI.getAmendmentByID(amendmentID)
  const { contract: contractID, providers: { encoders } } = amendment
  var isForMe
  
  for (const id of encoders) {
    const address = await chainAPI.getUserAddress(id)
    if (address === myAddress) isForMe = true  
  }

  if (!isForMe) return

  log({ type: 'encoder', data: [`Event received: ${event.method} ${event.data.toString()}`] })   
  const contract = await chainAPI.getContractByID(contractID)
  const { feed: feedID } = contract
  const { feedkey } = await chainAPI.getFeedByID(feedID)
  const { tasks } = account.state

  const topic = datdot_crypto.get_discoverykey(feedkey)
  const stringtopic = topic.toString('hex')
  if (!tasks[stringtopic]) return
  if (!tasks[stringtopic].amendments?.[amendmentID]) return
  const peers = tasks[stringtopic].amendments[amendmentID].peers
  if (!peers.length) return  
  delete tasks[stringtopic].amendments[amendmentID]
  done_task_cleanup({ role: 'encoder2author', topic, peers, state: account.state, log })
}

/* -----------------------------------------
            HOSTER REPLACEMENT
----------------------------------------- */
async function handle_hosterReplacement (args) {
  const { event, chainAPI, account, encoderkey, myAddress, log } = args
  const [amendmentID] = event.data
  const amendment = await chainAPI.getAmendmentByID(amendmentID)
  const { providers: { hosters, attesters, encoders }, pos } = amendment
  const encoderID = encoders[pos]
  const encoderAddress = await chainAPI.getUserAddress(encoderID)
  if (encoderAddress !== myAddress) return
  
  log({ type: 'encoder', data: [`Event received: ${event.method} ${event.data.toString()}`] })   

  const tid = setTimeout(() => {
    log({ type: 'encoder', data: { texts: 'error: hosterReplacement timeout', amendmentID } })
  }, DEFAULT_TIMEOUT)

  const data = { account, amendment, chainAPI, encoderkey, encoder_pos: pos, log }
  await encode_hosting_setup(data).catch(err => {
    log({ type: 'hosting setup', data: { text: 'error: encode', amendmentID }})
    return
  })
  clearTimeout(tid)
  log({ type: 'encoder', data: { type: `Encoding done` } })

}

// @NOTE:
// 1. encoded chunk has to be unique ([pos of encoder in the event, data]), so that hoster can not delete and download the encoded chunk from another hoster just in time
// 2. encoded chunk has to be signed by the original encoder so that the hoster cannot encode a chunk themselves and send it to attester
// 3. hoster verifies unique encoding data was signed by original encoder

/* -----------------------------------------
            HELPERS
----------------------------------------- */

  async function includesMe({ IDs, myAddress, chainAPI, log }) {
    log({ type: 'encoder', data: {  text: 'Is for me', IDs } })
    for (var i = 0, len = IDs.length; i < len; i++) {
      const id = IDs[i]
      const peerAddress = await chainAPI.getUserAddress(id)
      if (peerAddress === myAddress) return i
    }
  }

  async function encodeAndSendRange ({ account, temp_feed, range, feed, amendmentID, encoder_pos, log }) {
    return new Promise(async (resolve, reject) => {
      try {
        const sent = []
        for (let index = range[0], len = range[1] + 1; index < len; index++) {
          const proof_promise = download_and_encode({ account, index, feed, amendmentID, encoder_pos, log} )
          sent.push(send({ amendmentID, proof_promise, temp_feed, log }))
        }
        const resolved = await Promise.all(sent)
        resolve(resolved)
      } catch (err) {
        log({ type: 'encoder', data: {  text: 'Error in encodeAndSendRange', err } })
        reject(err)
      }
    })
  }
  async function send ({ amendmentID, proof_promise, temp_feed, log }) {
    return new Promise(async (resolve, reject) => {
      try {
        const proof = await proof_promise
        await temp_feed.append(proof_codec.encode(proof))
        log({ type: 'encoder', data: {  text:`MSG appended`, index: proof.index, amendmentID } })
        resolve(`Encoded ${proof.index} sent`)
      } catch (err) {
        log({ type: 'encoder', data: {  text: 'Error in send', err } })
        reject(err)
      }
    })
  }
  async function download_and_encode ({ account, index, feed, amendmentID, encoder_pos, log }) {
    try {
      log({ type: 'encoder', data: {  text: 'Get data for index', index } })
      const data_promise = feed.get(index)
      const data = await data_promise
      log({ type: 'encoder', data: {  text: 'Got data', index } })
      
      // encode and sign the encoded data
      const unique_el = `${amendmentID}/${encoder_pos}`
      const to_compress = serialize_before_compress(data, unique_el, log)
      const encoded_data = await brotli.compress(to_compress)
      const encoded_data_signature = account.sign(encoded_data)
      
      // make a proof
      const block = { index, nodes: await feed.core.tree.missingNodes(feed.length), value: true }
      const upgrade = { start: 0, length: feed.length }
      const p = cloneDeep(await feed.core.tree.proof({ block, upgrade }))
      p.block.value = data // add value for this block/chunk to the proof
      
      log({ type: 'encoder', data: {  text: 'Returning the proof', index } })
      return { type: 'proof', index, encoded_data, encoded_data_signature, p: proof_codec.to_string(p) }
    } catch(err) {
      log({ type: 'encoder', data: {  text: 'Error in download_and_encode', err } })
    }
  }

  async function encode_hosting_setup (data) {
    const{ account, amendment, chainAPI, encoderkey, encoder_pos, log } = data
    const { id: amendmentID, contract, providers: { attesters } } = amendment
    const { feed: feed_id, ranges } = await chainAPI.getContractByID(contract)
  
    const { feedkey } = await chainAPI.getFeedByID(feed_id)
    const [attesterID] = attesters
    const attesterkey = await chainAPI.getAttesterKey(attesterID)
  
    const log2Attester = log.sub(`Encoder to attester, me: ${account.noisePublicKey.toString('hex').substring(0,5)}, peer: ${attesterkey.toString('hex').substring(0,5)}, amendment: ${amendmentID}`)
    const log2Author= log.sub(`->Encoder to author, me: ${account.noisePublicKey.toString('hex').substring(0,5)}, amendment: ${amendmentID}`)
    // log2Attester({ type: 'encoder', data: { text: 'Starting the hosting setup' } })
    const { hyper } = account
  
    return new Promise(async (resolve, reject) => {
      try {
        if (!Array.isArray(ranges)) ranges = [[ranges, ranges]]
        const topic1 = datdot_crypto.get_discoverykey(feedkey)
        var peers = []
  
      
        // replicate feed from author
        const { feed } = await hyper.new_task({ feedkey, log: log2Author })
        await feed.update()
        log2Author({ type: 'encoder', data: { text: `load feed` } })
        
        await hyper.connect({ 
          swarm_opts: { role: 'encoder2author', topic: topic1, mode: { server: false, client: true } },
          onpeer,
        
          log: log2Author
        })
        
        function onpeer ({ peerkey, stringtopic }) {
          const { tasks } = account.state
          log2Author({ type: 'encoder', data: { text: `onpeer callback`, stringtopic, peerkey, amendmentID, tasks: JSON.stringify(tasks[stringtopic]) } })
          peers.push(peerkey.toString('hex'))
          // if (!tasks[stringtopic].amendments) {
          //   tasks[stringtopic].amendments = { [amendmentID]: { peers: [peerkey.toString('hex')]} }
          // } else {
          //   if (tasks[stringtopic].amendments[amendmentID]) tasks[stringtopic].amendments[amendmentID].peers.push(peerkey.toString('hex'))
          //   else tasks[stringtopic].amendments[amendmentID] = { peers: [peerkey.toString('hex')]}
          // }
        }
        
        async function done_with_author () {
          const stringtopic = topic1.toString('hex')
          const { tasks } = account.state
          log2Author({ type: 'encoder', data: { text: `calling done`, amendmentID, tasks: JSON.stringify(tasks[stringtopic]) } })
          // const peers = tasks[stringtopic].amendments[amendmentID].peers
          // if (!peers.length) return
          // delete account.state.tasks[stringtopic].amendments[amendmentID]  
          peers = [...new Set(peers)]                
          await done_task_cleanup({ role: 'encoder2author', peers, topic: topic1, state: account.state, log }) 
          peers = []
        }
    
        
        // create temp_feed for sending compressed and signed data to the attester
        const topic2 = derive_topic({ senderKey: encoderkey, feedkey, receiverKey: attesterkey, id: amendmentID, log })
        log2Attester({ type: 'encoder', data: { text: `Loading feed`, attester: attesterkey.toString('hex'), topic: topic2.toString('hex') } })
        
        // feed for attester
        const { feed: temp_feed} = await hyper.new_task({  topic: topic2, log: log2Attester })
  
        await hyper.connect({ 
          swarm_opts: { role: 'encoder2attester', topic: topic2, mode: { server: true, client: false } },
          targets: { feed: temp_feed, targetList: [attesterkey.toString('hex')], msg: { send: { type: 'feedkey' } } },
          onpeer: onattester,
          done: done_with_attester,
        
          log: log2Attester
        })
  
        async function onattester () {
          log2Attester({ type: 'encoder', data: { text: `Connected to the attester`, amendmentID, feedkey: feed.key.toString('hex') } })
          const all = []
          for (const range of ranges) {
            all.push(encodeAndSendRange({ account, temp_feed, range, feed, amendmentID, encoder_pos, log: log2Attester })) 
          }
  
          try {
            const result = await Promise.all(all)
            log2Attester({ type: 'encoder', data: { text: `All encoded & sent`, result } })
            done_with_author()
            return resolve()
          } catch (err) {
            log2Attester({ type: 'encoder', data: { text: 'Error in result', err } })
            reject(err)
          }
        }  
        async function done_with_attester ({ type }) {
          await done_task_cleanup({ role: 'encoder2attester', topic: topic2, remotestringkey: attesterkey.toString('hex'), state: account.state, log })
        }
      } catch(err) {
        log2Attester({ type: 'encoder', data: { text: 'Error in hosting setup', err } })
        clearTimeout(tid)
        reject(err)
      }
  
    })
  
  }