const varint = require('varint')
const hypercore = require('hypercore')
const RAM = require('random-access-memory')
const { toPromises } = require('hypercore-promisifier')
const Hyperbeam = require('hyperbeam')
const derive_topic = require('derive-topic')
const getRangesCount = require('getRangesCount')
const hyperswarm = require('hyperswarm')
const ready = require('hypercore-ready')
const get_signature = require('get-signature')
const get_nodes = require('get-nodes')
const get_index = require('get-index')
const download_range = require('download-range')
const EncoderDecoder = require('EncoderDecoder')
/******************************************************************************
  ROLE: Encoder
******************************************************************************/

module.exports = encoder

async function encoder (identity, log, APIS) {
  const { chainAPI, vaultAPI } = APIS
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
      if (!await isForMe(encoders, event)) return
      log({ type: 'chainEvent', data: [`Event received: ${event.method} ${event.data}`] })
      const feedKey = await chainAPI.getFeedKey(contract.feed)
      const [attestorID] = attestors
      const attestorKey = await chainAPI.getAttestorKey(attestorID)
      const data = { amendmentID, account: vaultAPI, attestorKey, encoderKey, feedKey, ranges: contract.ranges, log }
      await encode_hosting_setup(data).catch((error) => log({ type: 'error', data: [`error: ${error}`] }))
      // log({ type: 'encoder', data: [`Encoding done`] })
    }
  }
  // HELPERS
  async function isForMe (encoders, event) {
    for (var i = 0, len = encoders.length; i < len; i++) {
      const id = encoders[i]
      const peerAddress = await chainAPI.getUserAddress(id)
      if (peerAddress === myAddress) {
        log({ type: 'chainEvent', data: [`Encoder ${id}:  Event received: ${event.method} ${event.data.toString()}`] })
        return true
      }
    }
  }
}

/* -----------------------------------------
              Hosting setup
----------------------------------------- */

async function encode_hosting_setup (data) {
  const { amendmentID, account, attestorKey, encoderKey, feedKey, ranges, log } = data
  const log2Attestor = log.sub(`->Attestor ${attestorKey.toString('hex').substring(0,5)}`)
  const expectedChunkCount = getRangesCount(ranges)
  let stats = {
    ackCount: 0
  }
  return new Promise(async (resolve, reject) => {
    if (!Array.isArray(ranges)) ranges = [[ranges, ranges]]
    const feed = new hypercore(RAM, feedKey, { valueEncoding: 'utf-8', sparse: true })
    await ready(feed)
    const swarm = hyperswarm()
    swarm.join(feed.discoveryKey,  { announce: false, lookup: true })
    swarm.on('connection', (socket, info) => {
      socket.pipe(feed.replicate(info.client)).pipe(socket)  // TODO: sparse replication and download only chunks we need, do not replicate whole feed
    })

    // @NOTE:
    // sponsor provides only feedkey and swarmkey (no metadata)
    // when chain makes contracts, it checks if there is a signature for highest index of the contract
    // if not, it emits signature: true (only when signature is needed)
    // if (signature)
      // encoders in this contract get the signature for the highest index and send it to attestor
      // attestor compares the signatures and nodes and if they match, it sends them to the chain with the report

    // create temp hypercore
    const core = toPromises(new hypercore(RAM, { valueEncoding: 'utf-8' }))
    await core.ready()
   
    // connect to attestor
    const topic = derive_topic({ senderKey: encoderKey, feedKey, receiverKey: attestorKey, id: amendmentID })
    const beam = new Hyperbeam(topic)
    
    // send the key
    const temp_topic = topic + 'once'
    const beam_temp = new Hyperbeam(temp_topic)
    beam_temp.write(JSON.stringify({ type: 'feedkey', feedkey: core.key.toString('hex')}))
    
    // pipe streams
    const coreStream = core.replicate(true, { live: true, ack: true })
    coreStream.pipe(beam).pipe(coreStream)
    coreStream.on('ack', ack => {
      log2Attestor({ type: 'encoder', data: [`ACK from attestor: chunk received`] })
      stats.ackCount++
    })

    start(core)
    
    async function start (core) {
      var total = 0
      for (const range of ranges) total += (range[1] + 1) - range[0]
      log2Attestor({ type: 'encoder', data: [`Start encoding and sending data to attestor`] })
      for (const range of ranges) sendDataToAttestor({ account, core, range, feed, feedKey, log: log2Attestor, stats, expectedChunkCount })
    }
  })
}
async function sendDataToAttestor ({ account, core, range, feed, feedKey, log, stats, expectedChunkCount }) {
  for (let index = range[0], len = range[1] + 1; index < len; index++) {
    const msg = encode(account, index, feed, feedKey)
    send({ msg, core, log, stats, expectedChunkCount })
  }
}
async function send ({ msg, core, log, stats, expectedChunkCount }) {
  return new Promise(async (resolve, reject) => {
    const message = await msg
    await core.append(JSON.stringify(message))
    log({ type: 'encoder', data: [`MSG appended ${message.index}`]})
    if (stats.ackCount === expectedChunkCount) resolve(`Encoded ${message.index} sent`)
  })
}
async function encode (account, index, feed, feedKey) {
  await get_index(feed, index)
  const data = await get_index(feed, index)  
  const encoded = await EncoderDecoder.encode(data)
  const nodes = await get_nodes(feed, index)
  const signature = await get_signature(feed, index)
    
  // // Allocate buffer for the data that should be signed
  // const toSign = Buffer.alloc(encoded.length + varint.encodingLength(index))
  // // Write the index to the buffer that will be signed
  // varint.encode(index, toSign, 0)
  // // Copy the encoded data into the buffer that will be signed
  // encoded.copy(toSign, varint.encode.bytes)
  
  const proof = account.sign(encoded)
  return { type: 'encoded', feed: feedKey, index, encoded, proof, nodes, signature }

}

// @NOTE:
// 1. encoded chunk has to be unique ([pos of encoder in the event, data]), so that hoster can not delete and download the encoded chunk from another hoster just in time
// 2. encoded chunk has to be signed by the original encoder so that the hoster cannot encode a chunk themselves and send it to attester
// 3. attestor verifies unique encoding data was signed by original encoder