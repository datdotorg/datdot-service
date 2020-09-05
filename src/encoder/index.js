const sodium = require('sodium-universal')
const varint = require('varint')
const p2plex = require('p2plex')
const { seedKeygen } = require('noise-peer')

const peerConnect = require('../peer-connection')

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
    this.noiseKeyPair = noiseKeyPair
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
        comm: p2plex({ keyPair: encoder.noiseKeyPair }),
        senderKey: encoderKey,
        feedKey,
        receiverKey: attestorKey,
        id: contractID,
        myKey: encoderKey,
      }
      const streams = await peerConnect(opts, encoder.log.extend('->Attestor'))
      const all = []

      var total = 0
      for (const range of ranges) total += (range[1] + 1) - range[0]

      encoder.log('Start encoding and sending data to attestor')
      for (const range of ranges) {
        const rangeRes = sendDataToAttestor({ encoder, range, feed, feedKey, streams })
        all.push(...rangeRes)
      }
      try {
        const results = await Promise.all(all)
        encoder.log(`${all.length} confirmations received from the attestor`)
        encoder.log('Destroying communication with the attestor')
        streams.end()
        resolve(results)
      } catch (e) {
        console.log('ERROR', e)
        reject(e)
      }
    })
  }
}

function sendDataToAttestor ({ encoder, range, feed, feedKey, streams }) {
  const rangeRes = []
  for (let index = range[0], len = range[1] + 1; index < len; index++) {
    const message = encode(encoder, index, feed, feedKey)
    const chunkRes = send(message, { encoder, range, feed, feedKey, streams })
    rangeRes.push(chunkRes)
  }
  return rangeRes
}
async function send (msg, { encoder, range, feed, feedKey, streams }) {
  const message = await msg
  return new Promise(async (resolve, reject) => {
    // encoder.log(message.index, 'SEND_MSG',streams.peerKey.toString('hex'))
    streams.serialize$.write(message)
    var timeout
    const toID = setTimeout(async () => {
      timeout = true
      // streams.parse$.off('data', ondata)

      const error = [message.index, 'FAIL_ACK_TIMEOUT',streams.peerKey.toString('hex')]
      encoder.log(error)
      reject(error)
    }, DEFAULT_TIMEOUT)
    // encoder.log(message.index, 'WANT_ACK',streams.peerKey.toString('hex'))
    streams.parse$.once('data', ondata)

    // streams.parse$.on('data', data => console.log('ON DATA', data))

    function ondata (response) {
      encoder.log(response)
      if (timeout) return encoder.log(message.index, 'UNWANTED',streams.peerKey.toString('hex'))
      clearTimeout(toID)
      // @TODO what do we do if one or multiple encoders fail to do their work
      // do we have for example 5% tolerance for each encoder?
      // do we create a new contract if one fails?
      if (response.error) reject(new Error(response.error))
      // encoder.log(message.index, response, 'RECV_ACK',streams.peerKey.toString('hex'))
      resolve(response)
    }
    // const [response] = await once(streams.parse$, 'data')

    // if (!streams.parse$.waitAck) {
    //   streams.parse$.waitAck = 1
    //   streams.parse$.on('data', onAck)
    // } else {
    //
    // }
    // function onAck (response) {
    //   streams.parse$.waitAck
    //   streams.parse$.off('data', onAck)
    //   console.log('DATA', data)
    // }


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
