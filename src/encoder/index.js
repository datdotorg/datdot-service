const sodium = require('sodium-universal')
const varint = require('varint')
const { seedKeygen } = require('noise-peer')
const hypercore = require('hypercore')
const RAM = require('random-access-memory')
const { toPromises } = require('hypercore-promisifier')
const Hyperbeam = require('hyperbeam')
const derive_topic = require('../derive_topic')
const getRangesCount = require('../getRangesCount')

const NAMESPACE = 'datdot-encoder'
const IDENITY_NAME = 'signing'
const NOISE_NAME = 'noise'
const DEFAULT_TIMEOUT = 5000

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

  async encodeFor ({ amendmentID, attestorKey, encoderKey, feedKeyBuffer: feedKey, ranges }) {
    const encoder = this
    const log2Attestor = encoder.log.sub(`->Attestor ${attestorKey.toString('hex').substring(0,5)}`)
    
    return new Promise(async (resolve, reject) => {
      if (!Array.isArray(ranges)) ranges = [[ranges, ranges]]
      const expectedChunkCount = getRangesCount(ranges)
      let ackCount = 0
      const feed = encoder.Hypercore(feedKey)

      // create temp hypercore
      const core = toPromises(new hypercore(RAM, { valueEncoding: 'utf-8' }))
      await core.ready()
      
      // connect to attestor
      const topic = derive_topic({ senderKey: encoderKey, feedKey, receiverKey: attestorKey, id: amendmentID })
      const beam = new Hyperbeam(topic)
      // send the key
      const temp_topic = topic +'temp'
      const beam_temp = new Hyperbeam(temp_topic)
      beam_temp.write(JSON.stringify({ type: 'feedkey', feedkey: core.key.toString('hex')}))

      // pipe streams
      const coreStream = core.replicate(true, { live: true, ack: true })
      coreStream.pipe(beam).pipe(coreStream)
      start(core)

      async function start () {
        var total = 0
        for (const range of ranges) total += (range[1] + 1) - range[0]
        log2Attestor({ type: 'encoder', data: [`Start encoding and sending data to attestor`] })
        for (const range of ranges) sendDataToAttestor({ core, encoder, range, feed, feedKey, beam, log: log2Attestor })
      }
    })
  }
}

function sendDataToAttestor ({ core, encoder, range, feed, feedKey, beam, log }) {
  for (let index = range[0], len = range[1] + 1; index < len; index++) {
    const message = encode(encoder, index, feed, feedKey)
    send(message, { core, encoder, range, feed, feedKey, beam, log })
  }
}
async function send (msg, { core, encoder, range, feed, feedKey, beam, log }) {
  return new Promise(async (resolve, reject) => {
    const message = await msg
    console.log('Appending message', message.index)
    await core.append(JSON.stringify(message))
    log({ type: 'encoder', data: [`MSG appended ${message.index}`]})
  })
}
async function encode (encoder, index, feed, feedKey) {
  const data = await feed.get(index)
  const encoded = await encoder.EncoderDecoder.encode(data)
  const { nodes, signature } = await feed.proof(index)
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
