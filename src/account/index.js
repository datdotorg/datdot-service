const Hoster = require('../hoster')
const Encoder = require('../encoder')
const Attestor = require('../attestor')
const Node = require('../node')
const SDK = require('dat-sdk')
const DefaultEncoderDecoder = require('../EncoderDecoder')
const RAM = require('random-access-memory')
const envPaths = require('env-paths')
const path = require('path')
const fs = require('fs-extra')
const levelup = require('levelup')
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

    this.nonce = 0

    this.hoster = null
    this.encoder = null
    this.attestor = null
    this.sdkIdentity = null
    this.chainKeypair = null
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

    const node = new Node({ sdk, ...opts, EncoderDecoder, application, persist })

    await node.init()

    return node
  }

}
