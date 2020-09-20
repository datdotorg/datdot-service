const sodium = require('sodium-universal')
const varint = require('varint')
const p2plex = require('p2plex')
const { seedKeygen } = require('noise-peer')

const peerConnect = require('../p2plex-connection')
const requestResponse = require('../requestResponse')

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
    const { publicKey: replicationPublicKey } = await this.sdk.getIdentity()
    const signingSeed = await this.sdk.deriveSecret(NAMESPACE, IDENITY_NAME)
    const signingPublicKey = Buffer.alloc(sodium.crypto_sign_PUBLICKEYBYTES)
    const signingSecretKey = Buffer.alloc(sodium.crypto_sign_SECRETKEYBYTES)
    sodium.crypto_sign_seed_keypair(signingPublicKey, signingSecretKey, signingSeed)
    const noiseSeed = await this.sdk.deriveSecret(NAMESPACE, NOISE_NAME)
    const noiseKeyPair = seedKeygen(noiseSeed)
    this.communication = p2plex({ keyPair: noiseKeyPair })
    this.signingPublicKey = signingPublicKey
    this.signingSecretKey = signingSecretKey
    this.replicationPublicKey = replicationPublicKey
    this.publicKey = noiseKeyPair.publicKey
  }

  async encodeFor (contractID, attestorKey, encoderKey, feedKey, ranges) {
    const encoder = this
    return new Promise(async (resolve, reject) => {
      if (!Array.isArray(ranges)) ranges = [[ranges, ranges]]
      const feed = encoder.Hypercore(feedKey)

      const opts = {
        plex: this.communication,
        senderKey: encoderKey,
        feedKey,
        receiverKey: attestorKey,
        id: contractID,
        myKey: encoderKey,
      }
      const log2Attestor = encoder.log.sub(`->Attestor ${attestorKey.toString('hex').substring(0,5)}`)
      const streams = await peerConnect(opts, log2Attestor)
      const allChunks = []

      var total = 0
      for (const range of ranges) total += (range[1] + 1) - range[0]

      log2Attestor({ type: 'encoder', body: [`Start encoding and sending data to attestor`] })
      for (const range of ranges) {
        const rangeRes = sendDataToAttestor({ encoder, range, feed, feedKey, streams, log: log2Attestor })
        allChunks.push(...rangeRes)
      }
      try {
        const results = await Promise.all(allChunks).catch((error) => log2Attestor({ type: 'error', body: [`Error: ${error}`] }))
        if (!results) return reject('Encoder has not received all the confirmations')
        log2Attestor({ type: 'encoder', body: [`${allChunks.length} confirmations received from the attestor`] })
        log2Attestor({ type: 'encoder', body: [`Destroying communication with the attestor`] })
        streams.end()
        resolve(results)
      } catch (e) {
        log2Attestor({ type: 'encoder', body: [`Error: ${e}`] })
        reject(e)
      }
    })
  }
}

function sendDataToAttestor ({ encoder, range, feed, feedKey, streams, log }) {
  const rangeRes = []
  for (let index = range[0], len = range[1] + 1; index < len; index++) {
    const message = encode(encoder, index, feed, feedKey)
    const chunkRes = send(message, { encoder, range, feed, feedKey, streams, log })
    rangeRes.push(chunkRes)
  }
  return rangeRes
}
async function send (msg, { encoder, range, feed, feedKey, streams, log }) {
  const message = await msg
  return requestResponse({ message, sendStream: streams.serialize$, receiveStream: streams.parse$, log })
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
