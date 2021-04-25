const sodium = require('sodium-universal')
const { seedKeygen } = require('noise-peer')
const SDK = require('hyper-sdk')
const DefaultEncoderDecoder = require('EncoderDecoder')
const RAM = require('random-access-memory')
const envPaths = require('env-paths')
const path = require('path')
const fs = require('fs-extra')
const encode = require('encoding-down')
const memdown = require('memdown')
const { Keyring } = require('@polkadot/api')
const keyring = new Keyring({ type: 'sr25519' })
const levelup = require('levelup')
const sub = require('subleveldown')

const DEFAULT_SDK_APPLICATION = 'datdot-account'
const NAMESPACE = 'datdot-account'
const IDENTITY_NAME = 'identity'

const DEFAULT_TIMEOUT = 15000



module.exports = class Account {
  constructor ({ sdk, EncoderDecoder, application, persist }, log) {
    this.log = log
    const { Hypercore, Hyperdrive } = sdk

    this.Hypercore = Hypercore
    this.Hyperdrive = Hyperdrive
    this.sdk = sdk
    this.EncoderDecoder = EncoderDecoder
    this.application = application
    this.storageLocation = envPaths(application).data
    this.persist = persist
    this.application = application

    this.nonce = 0n

    this.hoster = null
    this.encoder = null
    this.attestor = null
    this.sdkIdentity = null
    this.chainKeypair = null
  }

  async getNonce () {
    return this.nonce++
  }

  async init () {
    if (this.persist) await fs.ensureDir(this.storageLocation)

    this.sdkIdentity = this.sdk.keyPair

    const accountSecret = await this.sdk.deriveSecret(NAMESPACE, IDENTITY_NAME)
    const accountUri = `0x${accountSecret.toString('hex')}`

    this.chainKeypair = keyring.addFromUri(accountUri)
  }

  static async load ({ persist = true, EncoderDecoder = DefaultEncoderDecoder, sdk, ...opts } = {}, log) {
    const sdkOpts = { application: DEFAULT_SDK_APPLICATION, ...opts }

    if (!persist) sdkOpts.storage = RAM

    if (!sdk) sdk = await SDK(sdkOpts)

    const { application } = sdkOpts

    const account = new Account({ sdk, ...opts, EncoderDecoder, application, persist }, log)

    await account.init()

    return account
  }

  async initHoster (log) {
    const NAMESPACE = 'datdot-hoster'
    const NOISE_NAME = 'noise'
    const storage = this.persist ? path.resolve(this.storageLocation, './hosterDB') : memdown()
    const db = levelup(encode(storage, { valueEncoding: 'binary' }))
    const hoster = {
      storages: new Map(),
      // keyOptions: new Map(),
      watchingFeeds: new Set(),
      loaderCache: new Map(),
      db,
      hosterDB: sub(db, 'hoster')
    }
    const sdk = await SDK({ aplication: 'datdot-account', storage: RAM})
    const noiseSeed = await sdk.deriveSecret(NAMESPACE, NOISE_NAME)
    const noiseKeyPair = seedKeygen(noiseSeed)
    hoster.publicKey = noiseKeyPair.publicKey
    // TODO: see how to restore 
    // const keys = (await hoster.hosterDB.get('all_keys').catch(e => {})) || []
    // for (const { key, options } of keys) {
    //   await hoster.setOpts(key, options)
    //   await hoster.getStorage(key)
    //   await hoster.loadFeedData(key)
    // }
    this.hoster = hoster
    return this.hoster
  }

  async initEncoder (log) {
    const NAMESPACE = 'datdot-encoder'
    const IDENITY_NAME = 'signing'
    const NOISE_NAME = 'noise'
    const encoder = {}
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
    this.encoder = encoder
    return this.encoder
  }

  async initAttestor (log) {
    const NAMESPACE = 'datdot-attestor'
    const NOISE_NAME = 'noise'
    const attestor = {}
    const sdk = await SDK({ aplication: 'datdot-account', storage: RAM})
    const noiseSeed = await sdk.deriveSecret(NAMESPACE, NOISE_NAME)
    const noiseKeyPair = seedKeygen(noiseSeed)
    attestor.publicKey = noiseKeyPair.publicKey
    this.attestor = attestor
    return this.attestor
  }

  get hosterIdentity () {
    return this.hoster.publicKey
  }

  get encoderIdentity () {
    return this.encoder.publicKey
  }

  get encoderSigningIdentity () {
    return this.encoder.signingPublicKey
  }

  get replicationIdentity () {
    return this.sdkIdentity.publicKey
  }

  get name () {
    if (!this.application) return DEFAULT_SDK_APPLICATION
    return this.application.replace('datdot-account-', '')
  }

  get address () {
    return this.chainKeypair.address
  }

  async attest (feedKey, index) {
    return this.attestor.attest(feedKey, index)
  }

  async stopHostingFeed (feedKey) {
    return this.hoster.removeFeed(feedKey)
  }

  async getHostingProof (feedKey, index) {
    const { encoded, proof } = await this.hoster.getStorageChallenge(feedKey, index)
    // const { encoded, proof, merkleProof }
    return { index, encoded, proof, feed: feedKey }
  }

  async listHostedKeys () {
    return this.hoster.listKeys()
  }

  async nextNonce () {
    // TODO: Persist somewhere?
    return this.nonce++
  }

  async signAndSend (transaction) {
    const nonce = await this.nextNonce()

    return transaction.signAndSend(this.chainKeypair, { nonce })
  }

  async close () {
    const toResolve = []

    if (this.hoster) this.toResolve.push(this.hoster.close())
    if (this.encoder) this.toResolve.push(this.encoder.close())
    this.toResolve.push(this.sdk.close())

    await Promise.all(toResolve)
  }
}
