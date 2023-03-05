const RAM = require('random-access-memory')
const derive_topic = require('derive-topic')
const hypercore = require('hypercore')
const Hyperbeam = require('hyperbeam')
const {done_task_cleanup} = require('_datdot-service-helpers/done-task-cleanup')
const proof_codec = require('datdot-codec/proof')
const brotli = require('_datdot-service-helpers/brotli')
const getRangesCount = require('getRangesCount')
const serialize_before_compress = require('serialize-before-compress')
const datdot_crypto = require('datdot-crypto')
const cloneDeep = require('clone-deep')
const DEFAULT_TIMEOUT = 5000

/******************************************************************************
  ROLE: Encoder
******************************************************************************/

module.exports = APIS => {
  
  return encoder 

  async function encoder (vaultAPI) {
    const account = vaultAPI
    const { identity, log, hyper } = account
    const { chainAPI } = APIS
    const { myAddress, noiseKey: encoderKey } = identity
    // log({ type: 'encoder', data: [`Listening to events for encoder role`] })

    await chainAPI.listenToEvents(handleEvent)
    
    // EVENTS
    async function handleEvent (event) {
      if (event.method === 'NewAmendment') {
        const [amendmentID] = event.data
        const amendment = await chainAPI.getAmendmentByID(amendmentID)
        const contract = await chainAPI.getContractByID(amendment.contract)
        const { encoders, attestors } = amendment.providers
        const encoder_pos = await isForMe(encoders, event)
        if (encoder_pos === undefined) return
        log({ type: 'encoder', data: [`Event received: ${event.method} ${event.data.toString()}`] })
        const { feedkey: feedKey } = await chainAPI.getFeedByID(contract.feed)
        const [attestorID] = attestors
        const attestorKey = await chainAPI.getAttestorKey(attestorID)
        const data = { account, amendmentID, chainAPI, attestorKey, encoderKey, ranges: contract.ranges, encoder_pos, feedKey, log }
        await encode_hosting_setup(data).catch((error) => {
          log({ type: 'error', data: [`error: ${JSON.stringify(error)}`] })
          return 
        })
        log({ type: 'encoder', data: { type: `Encoding done` } })
      }
    }
    // HELPERS
    async function isForMe (encoders, event) {
      for (var i = 0, len = encoders.length; i < len; i++) {
        const id = encoders[i]
        const peerAddress = await chainAPI.getUserAddress(id)
        if (peerAddress === myAddress) return i
      }
    }
    
  }
  
  /* -----------------------------------------
  Hosting setup
  ----------------------------------------- */
  
  async function encode_hosting_setup (data) {
    const{ account, amendmentID, chainAPI, attestorKey, encoderKey, ranges, encoder_pos, feedKey: feedkey, log } = data
    const log2Attestor = log.sub(`Encoder to attestor, me:${account.noisePublicKey.toString('hex').substring(0,5)}, peer:${attestorKey.toString('hex').substring(0,5)}, amendment: ${amendmentID}`)
    const log2Author= log.sub(`->Encoder to author, me:${account.noisePublicKey.toString('hex').substring(0,5)}, amendment: ${amendmentID}`)
    // log2Attestor({ type: 'encoder', data: { text: 'Starting the hosting setup' } })
    const expectedChunkCount = getRangesCount(ranges)
    const { hyper } = account

    return new Promise(async (resolve, reject) => {
      if (!Array.isArray(ranges)) ranges = [[ranges, ranges]]
      const topic1 = datdot_crypto.get_discoverykey(feedkey)
      const tid = setTimeout(() => {
        reject({ type: `encode_hosting_setup timeout` })
      }, DEFAULT_TIMEOUT)
      
      try {
        // replicate feed from author
        const { feed } = await hyper.new_task({ feedkey, log: log2Author })
        await feed.update()
        log2Author({ type: 'encoder', data: { text: `load feed` } })

        await hyper.connect({ 
          swarm_opts: { role: 'encoder2author', topic: topic1, mode: { server: false, client: true } },
          log: log2Author
        })
    
        
        // create temp feed for sending compressed and signed data to the attestor
        const topic2 = derive_topic({ senderKey: encoderKey, feedKey: feedkey, receiverKey: attestorKey, id: amendmentID, log })
        log2Attestor({ type: 'encoder', data: { text: `Loading feed`, attestor: attestorKey.toString('hex'), topic: topic2.toString('hex') } })
       
        // feed for attestor
        const { feed: temp} = await hyper.new_task({  topic: topic2, log: log2Attestor })

        await hyper.connect({ 
          swarm_opts: { role: 'encoder2attestor', topic: topic2, mode: { server: true, client: false } },
          targets: { feed: temp, targetList: [ attestorKey.toString('hex') ], ontarget: onattestor, msg: { send: { type: 'feedkey' } } },
          log: log2Attestor
        })
  
        async function onattestor () {
          log2Attestor({ type: 'encoder', data: { text: `Connected to the attestor` } })
          const all = []
          for (const range of ranges) all.push(encodeAndSendRange({ account, temp_feed: temp, range, feed, amendmentID, encoder_pos, expectedChunkCount, log: log2Attestor }))
          const result = await Promise.all(all).catch(err => { log2Attestor({ type: 'encoder', data: { text: 'Error in result', err } }) })
          log2Attestor({ type: 'encoder', data: { text: `All encoded & sent`, result } })
          clearTimeout(tid)
          await done_task_cleanup({ role: 'encoder2author', topic: topic1, state: account.state, log })                  
          resolve()
        }  
      } catch(err) {
        log2Attestor({ type: 'encoder', data: { text: 'Error in hosting setup', err } })
        clearTimeout(tid)
        reject()
      }

    })

    // HELPERS
    async function encodeAndSendRange ({ account, temp_feed, range, feed, amendmentID, encoder_pos, expectedChunkCount, log }) {
      return new Promise(async (resolve, reject) => {
        try {
          const sent = []
          for (let index = range[0], len = range[1] + 1; index < len; index++) {
            const proof_promise = download_and_encode(account, index, feed, amendmentID, encoder_pos, log)
            sent.push(send({ account, feedkey: feed.key, task_id: amendmentID, proof_promise, temp_feed, log }))
          }
          const resolved = await Promise.all(sent)
          resolve(range)
        } catch (err) {
          log({ type: 'encoder', data: {  text: 'Error in encodeAndSendRange', err } })
          reject('err', err)
        }
      })
    }
    async function send ({ proof_promise, temp_feed, log }) {
      return new Promise(async (resolve, reject) => {
        try {
          const proof = await proof_promise
          await temp_feed.append(proof_codec.encode(proof))
          log({ type: 'encoder', data: {  text:`MSG appended`, index: proof.index, amendmentID } })
          resolve(`Encoded ${proof.index} sent`)
        } catch (err) {
          log({ type: 'encoder', data: {  text: 'Error in send', err } })
          reject('err', err)
        }
      })
    }
    async function download_and_encode (account, index, feed, amendmentID, encoder_pos, log) {
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
  }

}

// @NOTE:
// 1. encoded chunk has to be unique ([pos of encoder in the event, data]), so that hoster can not delete and download the encoded chunk from another hoster just in time
// 2. encoded chunk has to be signed by the original encoder so that the hoster cannot encode a chunk themselves and send it to attester
// 3. hoster verifies unique encoding data was signed by original encoder