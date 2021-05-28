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
const get_roots = require('get-roots')
const get_nodes = require('get-nodes')
const serialize_before_compress = require('serialize-before-compress')
const get_index = require('get-index')
const audit = require('audit-hypercore')
const get_max_index = require('get-max-index')
const hypercore_replicated = require('hypercore-replicated')
const download_range = require('download-range')
const brotli = require('brotli')
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
      const encoder_id = await isForMe(encoders, event)
      if (encoder_id === undefined) return
      log({ type: 'chainEvent', data: [`Event received: ${event.method} ${event.data}`] })
      const feedKey = await chainAPI.getFeedKey(contract.feed)
      const feed = await chainAPI.getFeedByID(contract.feed)
      var root_signatures = feed.signatures
      const [attestorID] = attestors
      const attestorKey = await chainAPI.getAttestorKey(attestorID)
      const data = { amendmentID, account: vaultAPI, attestorKey, encoderKey, feedKey, ranges: contract.ranges, encoder_id, root_signatures, log }
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
        return id
      }
    }
  }

}

/* -----------------------------------------
              Hosting setup
----------------------------------------- */

async function encode_hosting_setup (data) {
  const { amendmentID, account, attestorKey, encoderKey, feedKey, ranges, encoder_id, log } = data
  const log2Attestor = log.sub(`->Attestor ${attestorKey.toString('hex').substring(0,5)}`)
  const expectedChunkCount = getRangesCount(ranges)
  let stats = {
    ackCount: 0
  }
  return new Promise(async (resolve, reject) => {
    if (!Array.isArray(ranges)) ranges = [[ranges, ranges]]
    const feed = new hypercore(RAM, feedKey, { valueEncoding: 'binary', sparse: true })
    await ready(feed)
    const swarm = hyperswarm()
    swarm.join(feed.discoveryKey,  { announce: false, lookup: true })
    swarm.on('connection', async (socket, info) => {
      socket.pipe(feed.replicate(info.client)).pipe(socket)
      // @NOTE:
      // sponsor provides only feedkey and swarmkey (no metadata)
      // when chain makes contracts, it checks if there is a signature for highest index of the contract
      // if not, it emits signature: true (only when signature is needed)  => OR ATTESTOR DOES THE CHECK when event is received
      // if (signature)
        // encoders in this contract get the signature for the highest index and send it to attestor
        // attestor compares the signatures and nodes and if they match, it sends them to the chain with the report
  
      // create temp hypercore
      const core = toPromises(new hypercore(RAM, { valueEncoding: 'binary' }))
      await core.ready()
     
      // connect to attestor
      const topic = derive_topic({ senderKey: encoderKey, feedKey, receiverKey: attestorKey, id: amendmentID })
      const beam = new Hyperbeam(topic)
      
      // send the key and signature
      const temp_topic = topic + 'once'
      const beam_temp = new Hyperbeam(temp_topic)
      await hypercore_replicated(feed)
      const max = get_max_index(ranges)
      const version = feed.length -1
      const match =  data.root_signatures[version] 
      var sig = match ? match : await get_signature(feed, feed.length - 1)
      const feed_and_signature = { feedKey: core.key.toString('hex'), root_signature: { version: feed.length - 1, signature: sig.toString('hex') } }
      beam_temp.write(JSON.stringify({ type: 'feedkey_and_signature', data: JSON.stringify(feed_and_signature) }))
      // beam_temp.write(JSON.stringify({ type: 'feedkey', data: [core.key.toString('hex'), signature.toString('hex')] }))
      
      // pipe streams
      const coreStream = core.replicate(true, { live: true, ack: true })
      coreStream.pipe(beam).pipe(coreStream)
      coreStream.on('ack', ack => {
        log2Attestor({ type: 'encoder', data: [`ACK from attestor: chunk received`] })
        stats.ackCount++
      })
  
      start(core)
    })

    
    async function start (core) {
      var total = 0
      for (const range of ranges) total += (range[1] + 1) - range[0]
      log2Attestor({ type: 'encoder', data: [`Start encoding and sending data to attestor`] })
      for (const range of ranges) sendDataToAttestor({ account, core, range, feed, feedKey, log: log2Attestor, stats, encoder_id, expectedChunkCount })
    }
  })
}
async function sendDataToAttestor ({ account, core, range, feed, feedKey, log, stats, amendmentID, encoder_id, expectedChunkCount }) {
  for (let index = range[0], len = range[1] + 1; index < len; index++) {
    const msg = download_and_encode(account, index, feed, feedKey, amendmentID, encoder_id)
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
async function download_and_encode (account, index, feed, feedKey, amendmentID, encoder_id) {
  const data = await get_index(feed, index)
  const version = feed.length - 1
  // await audit(feed)  
  const to_compress = serialize_before_compress(data, encoder_id)
  const encoded_data = await brotli.compress(to_compress)
  const encoded_data_signature = account.sign(encoded_data)
  const signature = await get_signature(feed, version)
  const nodes = await get_nodes(feed, index, version)

  return { type: 'encoded', feedKey, index, encoded_data, encoder_id, encoded_data_signature, version, nodes, signature }
}

// @NOTE:
// 1. encoded chunk has to be unique ([pos of encoder in the event, data]), so that hoster can not delete and download the encoded chunk from another hoster just in time
// 2. encoded chunk has to be signed by the original encoder so that the hoster cannot encode a chunk themselves and send it to attester
// 3. attestor verifies unique encoding data was signed by original encoder