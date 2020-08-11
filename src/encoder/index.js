const { once } = require('events')
const sodium = require('sodium-universal')
const varint = require('varint')
const p2plex = require('p2plex')
const pump = require('pump')
const ndjson = require('ndjson')
const { seedKeygen } = require('noise-peer')
const NAMESPACE = 'datdot-encoder'
const IDENITY_NAME = 'signing'
const NOISE_NAME = 'noise'

module.exports = class Encoder {
  constructor ({
    sdk,
    EncoderDecoder
  }) {
    const { Hypercore } = sdk
    this.sdk = sdk
    this.Hypercore = Hypercore
    this.EncoderDecoder = EncoderDecoder
  }

  static async load (opts) {
    const encoder = new Encoder(opts)

    await encoder.init()

    return encoder
  }

  async init () {
    const { publicKey: replicationPublicKey } = await this.sdk.getIdentity()

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

    this.communication = p2plex({ keyPair: noiseKeyPair })
  }

  async encodeFor (hosterKey, attestorKey, feedKey, ranges) {

    if (!Array.isArray(ranges)) {
      const index = ranges
      ranges = [[index, index]]
    }

    // @TODO: Derive shared key
    const topic = feedKey

    const feed = this.Hypercore(feedKey)

    // @TODO: Add timeout for when we can't find the attestor

    const peer = await this.communication.findByTopicAndPublicKey(topic, attestorKey, { announce: false, lookup: true })
    const resultStream = ndjson.serialize()
    const confirmStream = ndjson.parse()

    const encodingStream = peer.createStream(topic)
    pump(resultStream, encodingStream, confirmStream)

    for (const range of ranges) {
      for (let index = range[0], len = range[1] + 1; index < len; index++) {
        // TODO: Add timeout for when we can't get feed data
        const data = await feed.get(index)

        const encoded = await this.EncoderDecoder.encode(data)
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
        sodium.crypto_sign_detached(proof, toSign, this.signingSecretKey)
        // Send the encoded stuff over to the hoster so they can store it
        resultStream.write({
          type: 'encoded',
          feed: feedKey,
          index,
          encoded,
          proof,
          nodes,
          signature
        })
        // --------------------------------------------------------------

        // Wait for the attestor to tell us they've handled the data
        // @TODO: Set up timeout for when peer doesn't respond to us
        const [response] = await once(confirmStream, 'data')

        if (response.error) {
          throw new Error(response.error)
          // @TODO what do we do if one or multiple encoders fail to do their work
          // do we have for example 5% tolerance for each encoder?
          // do we create a new contract if one fails?
        }
      }
    }
    encodingStream.end()
  }

  async close () {
    return this.communication.destroy()
  }
}
