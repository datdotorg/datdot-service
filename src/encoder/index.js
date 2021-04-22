const sodium = require('sodium-universal')
const RAM = require('random-access-memory')
const SDK = require('hyper-sdk')
const { seedKeygen } = require('noise-peer')

const NAMESPACE = 'datdot-encoder'
const IDENITY_NAME = 'signing'
const NOISE_NAME = 'noise'
const DEFAULT_TIMEOUT = 15000

module.exports = class Encoder {
  constructor (log) {
    this.log = log
  }

  static async load (log) {
    const encoder = new Encoder(log)
    const sdk = await SDK({ aplication: 'datdot-account', storage: RAM})
    const { publicKey: replicationPublicKey } = sdk.keyPair
    const signingSeed = await sdk.deriveSecret(NAMESPACE, IDENITY_NAME)
    const signingPublicKey = Buffer.alloc(sodium.crypto_sign_PUBLICKEYBYTES)
    const signingSecretKey = Buffer.alloc(sodium.crypto_sign_SECRETKEYBYTES)
    sodium.crypto_sign_seed_keypair(signingPublicKey, signingSecretKey, signingSeed)
    const noiseSeed = await sdk.deriveSecret(NAMESPACE, NOISE_NAME)
    const noiseKeyPair = seedKeygen(noiseSeed)
    encoder.signingPublicKey = signingPublicKey
    encoder.signingSecretKey = signingSecretKey
    encoder.replicationPublicKey = replicationPublicKey
    encoder.publicKey = noiseKeyPair.publicKey
    return encoder
  }

}

