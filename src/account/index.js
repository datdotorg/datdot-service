const Hoster = require('../hoster')
const Encoder = require('../encoder')
const Attestor = require('../attestor')
const SDK = require('dat-sdk')
const DefaultEncoderDecoder = require('../EncoderDecoder')
const RAM = require('random-access-memory')
const envPaths = require('env-paths')
const path = require('path')
const fs = require('fs-extra')
const levelup = require('levelup')
const encode = require('encoding-down')
const memdown = require('memdown')
const { Keyring } = require('@polkadot/api')
const keyring = new Keyring({ type: 'sr25519' })

const DEFAULT_SDK_APPLICATION = 'datdot-account'
const NAMESPACE = 'datdot-account'
const IDENTITY_NAME = 'identity'


module.exports = class Account {
  constructor ({ sdk, EncoderDecoder, application, persist }) {
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

    this.sdkIdentity = await this.sdk.getIdentity()

    const accountSecret = await this.sdk.deriveSecret(NAMESPACE, IDENTITY_NAME)
    const accountUri = `0x${accountSecret.toString('hex')}`

    this.chainKeypair = keyring.addFromUri(accountUri)
  }

  static async load ({ persist = true, EncoderDecoder = DefaultEncoderDecoder, sdk, ...opts } = {}) {
    const sdkOpts = { application: DEFAULT_SDK_APPLICATION, ...opts }

    if (!persist) sdkOpts.storage = RAM

    if (!sdk) sdk = await SDK(sdkOpts)

    const { application } = sdkOpts

    const account = new Account({ sdk, ...opts, EncoderDecoder, application, persist })

    await account.init()

    return account
  }

  async initHoster ({ db, ...opts } = {}) {
    const { sdk, EncoderDecoder } = this

    // if (!opts.onNeedsEncoding) throw new TypeError('Must specify onNeedsEncoding function')

    if (!db) {
      const storage = this.persist ? path.resolve(this.storageLocation, './hosterDB') : memdown()
      db = levelup(encode(storage))
    }

    this.hoster = await Hoster.load({ sdk, db, EncoderDecoder, ...opts })

    return this.hoster
  }

  async initEncoder (opts = {}) {
    const { sdk, EncoderDecoder } = this

    this.encoder = await Encoder.load({ sdk, EncoderDecoder, ...opts })

    return this.encoder
  }

  async initAttestor (opts = {}) {
    const { sdk } = this

    this.attestor = await Attestor.load({ sdk, ...opts })

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
		if(!this.application) return DEFAULT_SDK_APPLICATION
		return this.application.replace('datdot-account-', '')
  }

  get address() {
		return this.chainKeypair.address
  }

  async attest (feedKey, index) {
    return this.attestor.attest(feedKey, index)
  }

  // async encodeFor (hosterIdentity, attestorKey, feedKey, ranges) {
  //   return this.encoder.encodeFor(hosterIdentity, attestorKey, feedKey, ranges)
  // }

  // async hostFeed (feedKey, encoderIdentity, plan) {
  //   return this.hoster.addFeed(feedKey, encoderIdentity, plan)
  // }

  async stopHostingFeed (feedKey) {
    return this.hoster.removeFeed(feedKey)
  }

  async getHostingProof (feedKey, index) {
    const { encoded, proof, merkleProof } = await this.hoster.getStorageChallenge(feedKey, index)

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
