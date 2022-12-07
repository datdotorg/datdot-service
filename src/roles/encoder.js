const RAM = require('random-access-memory')
const derive_topic = require('derive-topic')
const hypercore = require('hypercore')
const Hyperbeam = require('hyperbeam')
const remove_task_from_cache = require('_datdot-service-helpers/remove-task-from-cache')
const { toPromises } = require('hypercore-promisifier')
const proof_codec = require('datdot-codec/proof')
const brotli = require('_datdot-service-helpers/brotli')
const getRangesCount = require('getRangesCount')
const get_max_index = require('_datdot-service-helpers/get-max-index')
const serialize_before_compress = require('serialize-before-compress')
const datdot_crypto = require('datdot-crypto')
const DEFAULT_TIMEOUT = 10500

/******************************************************************************
  ROLE: Encoder
******************************************************************************/

module.exports = APIS => {
  
  return encoder 

  async function encoder (identity, log) {
    const { chainAPI, vaultAPI, store } = APIS
    const account = await vaultAPI
    const { myAddress, noiseKey: encoderKey } = identity
    log({ type: 'encoder', data: [`Listening to events for encoder role`] })

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
        const { feedkey: feedKey, signatures } = await chainAPI.getFeedByID(contract.feed)
        const [attestorID] = attestors
        const attestorKey = await chainAPI.getAttestorKey(attestorID)
        const data = { store, amendmentID, chainAPI, account, attestorKey, encoderKey, ranges: contract.ranges, encoder_pos, signatures, feedKey, log }
        await encode_hosting_setup(data).catch((error) => log({ type: 'error', data: [`error: ${JSON.stringify(error)}`] }))
        // when all done, remove task
        log({ type: 'encoder', data: [`Encoding done`] })
        // await remove_task_from_cache({ store, topic: topic1, cache: account.cache, log: log1 })
        // await remove_task_from_cache({ store, topic: topic2, cache: account.cache, log: log2 })
                  
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
    const{ store, amendmentID, chainAPI, account, attestorKey, encoderKey, ranges, encoder_pos, signatures, feedKey: feedkey, log } = data
    const log2Attestor = log.sub(`Encoder to attestor ${attestorKey.toString('hex').substring(0,5)}`)
    const log2Author= log.sub(`->Encoder to author ${attestorKey.toString('hex').substring(0,5)} ${feedkey.toString('hex').substring(0,5)}`)
    log2Attestor({ type: 'encoder', data: { text: 'Starting the hosting setup' } })
    const expectedChunkCount = getRangesCount(ranges)
    var download_count = 0
    let stats = {
      ackCount: 0
    }
    return new Promise(async (resolve, reject) => {
      if (!Array.isArray(ranges)) ranges = [[ranges, ranges]]
      const topic1 = datdot_crypto.get_discoverykey(feedkey)
      const tid = setTimeout(() => {
        reject({ type: `compare and send_timeout` })
      }, DEFAULT_TIMEOUT)
      
      try {
        // replicate feed from author
        const { feed } = await store.load_feed({ feedkey, log: log2Author })
        await feed.update()
        log2Author({ type: 'encoder', data: { text: `Loaded feed to connect to the author` } })

        await store.connect({ 
          swarm_opts: { topic: topic1, mode: { server: true, client: true } },
          log: log2Author
        })
    
        
        // create temp feed for sending compressed and signed data to the attestor
        const topic2 = derive_topic({ senderKey: encoderKey, feedKey: feedkey, receiverKey: attestorKey, id: amendmentID, log })
        log2Attestor({ type: 'encoder', data: { text: `Loading feed to connect to the attestor`, topic: topic2.toString('hex') } })
       
        // feed for attestor
        const { feed: temp} = await store.load_feed({  topic: topic2, log: log2Attestor })

        await store.connect({ 
          swarm_opts: { topic: topic2, mode: { server: true, client: false } },
          peers: { feed: temp, peerList: [ attestorKey.toString('hex') ], onpeer, msg: { send: { type: 'feedkey' } } },
          log: log2Attestor
        })
  
        async function onpeer () {
          log2Attestor({ type: 'encoder', data: { text: `Connected to the attestor` } })
          const all = []
          for (const range of ranges) all.push(encodeAndSend({ account, temp_feed: temp, range, feed, stats, signatures, amendmentID, encoder_pos, expectedChunkCount, log: log2Attestor }))
          Promise.all(all)
          clearTimeout(tid)
          resolve()
        }  
      } catch(err) {
        log2Attestor({ type: 'encoder', data: { text: 'Error in hosting setup', err } })
        reject()
      }

    })

    // HELPERS
    async function encodeAndSend ({ account, temp_feed, range, feed, stats, signatures, amendmentID, encoder_pos, expectedChunkCount, log }) {
      for (let index = range[0], len = range[1] + 1; index < len; index++) {
        log({ type: 'encoder', data: { text: 'Download index', index, range }})
        const proof_promise = download_and_encode(account, index, feed, signatures, amendmentID, encoder_pos, log)
        send({ account, feedkey: feed.key, task_id: amendmentID, proof_promise, temp_feed, log, stats, expectedChunkCount })
      }
    }
    async function send ({ proof_promise, temp_feed, stats, expectedChunkCount, log }) {
      return new Promise(async (resolve, reject) => {
        const proof = await proof_promise
        await temp_feed.append(proof_codec.encode(proof))
        log({ type: 'encoder', data: {  text:`MSG appended`, index: proof.index, amendmentID } })
        if (stats.ackCount === expectedChunkCount) {
          log({ type: 'encoder', data: {  text:`All encoded sent`, amendmentID, index: proof.index } })
          // await remove_task_from_cache({ account, topic: feed.discoveryKey, tasks: account.cache['general'].tasks, log })
          resolve(`Encoded ${proof.index} sent`)
        }
      })
    }
    async function download_and_encode (account, index, feed, signatures, amendmentID, encoder_pos, log) {
      const data = await feed.get(index)
      const unique_el = `${amendmentID}/${encoder_pos}`
      const to_compress = serialize_before_compress(data, unique_el, log)
      log({ type: 'encoder', data: {  text: `Got data`, data: data.toString(), index, to_compress: to_compress.toString('hex'), amendmentID }})
      const encoded_data = await brotli.compress(to_compress)
      const encoded_data_signature = account.sign(encoded_data)
      return { type: 'proof', index, encoded_data, encoded_data_signature }
    }
  }

}

// @NOTE:
// 1. encoded chunk has to be unique ([pos of encoder in the event, data]), so that hoster can not delete and download the encoded chunk from another hoster just in time
// 2. encoded chunk has to be signed by the original encoder so that the hoster cannot encode a chunk themselves and send it to attester
// 3. attestor verifies unique encoding data was signed by original encoder