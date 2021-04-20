const sodium = require('sodium-universal')
const varint = require('varint')
const { seedKeygen } = require('noise-peer')
const hypercore = require('hypercore')
const RAM = require('random-access-memory')
const { toPromises } = require('hypercore-promisifier')
const Hyperbeam = require('hyperbeam')
const derive_topic = require('../derive_topic')
const getRangesCount = require('../getRangesCount')
const hyperswarm = require('hyperswarm')
const ready = require('../hypercore-ready')
const get_signature = require('../get-signature')
const get_nodes = require('../get-nodes')
const get_data = require('../get-data')
const verify_signature = require('../verify-signature')

const NAMESPACE = 'datdot-encoder'
const IDENITY_NAME = 'signing'
const NOISE_NAME = 'noise'
const DEFAULT_TIMEOUT = 15000

module.exports = class Encoder {
  constructor ({ sdk, EncoderDecoder }, log) {
    const { Hypercore } = sdk
    this.sdk = sdk
    this.Hypercore = Hypercore
    this.EncoderDecoder = EncoderDecoder
    this.log = log
  }

  static async load (opts, log) {
    const encoder = new Encoder(opts, log)
    await encoder.init()
    return encoder
  }

  async init () {
    const { publicKey: replicationPublicKey } = this.sdk.keyPair
    const signingSeed = await this.sdk.deriveSecret(NAMESPACE, IDENITY_NAME)
    const signingPublicKey = Buffer.alloc(sodium.crypto_sign_PUBLICKEYBYTES)
    const signingSecretKey = Buffer.alloc(sodium.crypto_sign_SECRETKEYBYTES)
    sodium.crypto_sign_seed_keypair(signingPublicKey, signingSecretKey, signingSeed)
    const noiseSeed = await this.sdk.deriveSecret(NAMESPACE, NOISE_NAME)
    const noiseKeyPair = seedKeygen(noiseSeed)
    this.signingPublicKey = signingPublicKey
    this.signingSecretKey = signingSecretKey
    this.replicationPublicKey = replicationPublicKey
    this.publicKey = noiseKeyPair.publicKey
  }

    /* ----------------------------------------------------------------------
                              ENCODE
  ---------------------------------------------------------------------- */

  async encodeFor ({ amendmentID, attestorKey, encoderKey, feedKeyBuffer: feedKey, ranges }) {
    const encoder = this
    const log2Attestor = encoder.log.sub(`->Attestor ${attestorKey.toString('hex').substring(0,5)}`)
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
        console.log('new connection')
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
        for (const range of ranges) sendDataToAttestor({ core, encoder, range, feed, feedKey, beam, log: log2Attestor, stats, expectedChunkCount })
      }
    })
  }
}

function sendDataToAttestor ({ core, encoder, range, feed, feedKey, beam, log, stats, expectedChunkCount }) {
  for (let index = range[0], len = range[1] + 1; index < len; index++) {
    const msg = encode(encoder, index, feed, feedKey)
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
async function encode (encoder, index, feed, feedKey) {
  const data = await get_data(feed, index)
  const encoded = await encoder.EncoderDecoder.encode(data)
  const nodes = await get_nodes(feed, index)
  const signature = await get_signature(feed, index)
  console.log({nodes, signature})
  // Allocate buffer for the proof
  const proof = Buffer.alloc(sodium.crypto_sign_BYTES)
  // Allocate buffer for the data that should be signed
  const toSign = Buffer.alloc(encoded.length + varint.encodingLength(index))
  // Write the index to the buffer that will be signed
  varint.encode(index, toSign, 0)
  // Copy the encoded data into the buffer that will be signed
  encoded.copy(toSign, varint.encode.bytes)
  // Sign the data with our signing secret key and write it to the proof buffer
  sodium.crypto_sign_detached(proof, toSign, encoder.signingSecretKey)
  return { type: 'encoded', feed: feedKey, index, encoded, proof, nodes, signature }
}

// @NOTE:
// 1. encoded chunk has to be unique ([pos of encoder in the event, data]), so that hoster can not delete and download the encoded chunk from another hoster just in time
// 2. encoded chunk has to be signed by the original encoder so that the hoster cannot encode a chunk themselves and send it to attester
// 3. attestor verifies unique encoding data was signed by original encoder