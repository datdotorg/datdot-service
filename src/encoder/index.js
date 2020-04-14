const { once } = require('events')
const sodium = require('sodium-universal')
const varint = require('varint')

const NAMESPACE = 'datdot-encoder'
const IDENITY_NAME = 'identity'

module.exports = class Encoder {
  constructor ({
    sdk,
    communication,
    EncoderDecoder
  }) {
    const { Hypercore } = sdk
    this.sdk = sdk
    this.Hypercore = Hypercore
    this.communication = communication
    this.EncoderDecoder = EncoderDecoder
  }

  static async load (opts) {
    const encoder = new Encoder(opts)

    await encoder.init()

    return encoder
  }

  async init () {
    const { publicKey: replicationPublicKey } = await this.sdk.getIdentity()

    const seed = await this.sdk.deriveSecret(NAMESPACE, IDENITY_NAME)

    const publicKey = Buffer.alloc(sodium.crypto_sign_PUBLICKEYBYTES)
    const secretKey = Buffer.alloc(sodium.crypto_sign_SECRETKEYBYTES)

    sodium.crypto_sign_seed_keypair(publicKey, secretKey, seed)

    this.signingPublicKey = publicKey
    this.signingSecretKey = secretKey
    this.replicationPublicKey = replicationPublicKey
  }

  async encodeFor (hosterKey, feedKey, index) {
    const feed = this.Hypercore(feedKey)

    // TODO: Add timeout for when we can't get feed data
    const data = await feed.get(index)

    // TODO: Add timeout for when we can't find the hoster
    const peer = await this.communication.findPeer(hosterKey)

    const encoded = await this.EncoderDecoder.encode(data)

    // Allocate buffer for the proof
    const proof = Buffer.alloc(sodium.crypto_sign_BYTES)

    // Allocate buffer for the data that should be signed
    const toSign = Buffer.alloc(encoded.length + varint.encodingLength(index))

    // Write the index to the buffer that will be signed
    varint.encode(index, toSign, 0)
    // Copy the encoded data into the buffer that will be signed
    encoded.copy(toSign, varint.encode.bytes)

    // Sign the data with our singning scret key and write it to the proof buffer
    sodium.crypto_sign_detached(proof, toSign, this.signingSecretKey)

    // Send the encoded stuff over to the hoster so they can store it
    // TODO: Figure out why this timing is necessary.
    setTimeout(() => {
      peer.send({
        type: 'encoded',
        feed: feedKey,
        index,
        encoded,
        proof
      })
    }, 1000)

    // TODO: Set up timeout for when peer doesn't respond to us
    const [response] = await once(peer, 'message')

    peer.close()

    if (response.error) {
      throw new Error(response.error)
    }

    return {
      feedKey,
      index,
      hosterKey,
      encoded,
      proof,
      response
    }
  }
}
