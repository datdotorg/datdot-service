const { cryptoWaitReady } = require('@polkadot/util-crypto')
const ready = cryptoWaitReady()
const sodium = require('sodium-universal')
const { seedKeygen } = require('noise-peer')
// const SDK = require('hyper-sdk')
const RAM = require('random-access-memory')
const path = require('path')
const fs = require('fs-extra')
const encode = require('encoding-down')
const memdown = require('memdown')
const { Keyring } = require('@polkadot/api')
const keyring = new Keyring({ type: 'sr25519' })
const levelup = require('levelup')
const sub = require('subleveldown')

const deriveseed = require('derive-key')
const hypercoreCrypto = require('hypercore-crypto')
const HypercoreProtocol = require('hypercore-protocol')

/*******************************
  MASTER SEED
*******************************/
const masterseed = hypercoreCrypto.randomBytes(32) // make sure this is high-entropy master key, eg. from a CSPRNG


module.exports = account

async function account ({name, log}) {
  await ready
  const account = {}
  let nonce = 0n

  // const sdk = await SDK({ aplication: 'datdot-account', valueEncoding: 'binary', storage: RAM})

  const accountSecret = deriveSecret('datdot-account', masterseed, 'identity')
  // const accountSecret = await sdk.deriveSecret('datdot-account', 'identity')

  const accountUri = `0x${accountSecret.toString('hex')}`
  account.chainKeypair = keyring.addFromUri(accountUri)


  const noiseseed_account = deriveSecret('datdot-account', masterseed, 'replication-seed')
  const keyPair = HypercoreProtocol.keyPair(noiseseed_account)
  const { publicKey: replicationPublicKey } = keyPair
  // const { publicKey: replicationPublicKey } = sdk.keyPair
  
  // const signingSeed = await sdk.deriveSecret('datdot-user', 'signing')
  const signingSeed = deriveSecret('datdot-user', masterseed, 'signing')

  const signingPublicKey = Buffer.alloc(sodium.crypto_sign_PUBLICKEYBYTES)
  const signingSecretKey = Buffer.alloc(sodium.crypto_sign_SECRETKEYBYTES)
  sodium.crypto_sign_seed_keypair(signingPublicKey, signingSecretKey, signingSeed)
  // const noiseSeed = await sdk.deriveSecret('datdot-user', 'noise')
  const noiseSeed = deriveSecret('datdot-user', masterseed, 'noise')

  const noiseKeyPair = seedKeygen(noiseSeed)
  account.signingPublicKey = signingPublicKey
  account.signingSecretKey = signingSecretKey
  account.replicationPublicKey = replicationPublicKey
  account.publicKey = noiseKeyPair.publicKey

  account.storages = new Map()
  account.watchingFeeds = new Set()
  account.loaderCache = new Map()
  const storage = account.persist ? path.resolve(account.storageLocation, './hosterDB') : memdown()
  const db = levelup(encode(storage, { valueEncoding: 'binary' }))
  account.db = db
  account.hosterDB = sub(db, 'hoster')
  account.getNonce = () => nonce++
  account.sign = sign

  return account

  function sign (toSign) {
    // Allocate buffer for the proof
    const signature = Buffer.alloc(sodium.crypto_sign_BYTES)
    // Sign the data with our signing secret key and write it to the proof buffer
    sodium.crypto_sign_detached(signature, toSign, signingSecretKey)
    return signature
  }
}


function deriveSecret (namespace, seed, name, output) {
  // Do NOT use low entropy sources such a passwords/passphrases/predictableRNG
  // The `namespace` should be an ascii string (fx your application name)
  // and `name` can be a buffer or string reflecting the name of the key you want to derive.
  // Optionally you can pass in the output key parameter and the result will be written into this buffer instead
  // of a new buffer being allocated internally.
  const derived_seed = deriveseed(namespace, seed, name)
  //
  // randomAccessStorage.write(0, masterseed, err => { if (!err) randomAccessStorage.close(cb) })

  /*******************************
    NOISE (replication) KEY
  *******************************/
  // @TODO: just for noisekey pair for swarmNetworker
  // I think this is used to create a persisted identity?
  // Needs to be created before the swarm so that it can be passed in
  // const applicationName = namespace
  // const _name = 'replication-seed'
  // const noiseSeed = deriveseed(applicationName, appseed, _name)
  // const keyPair = HypercoreProtocol.keyPair(noiseSeed)
  //
  // const swarm = new SwarmNetworker(corestore, Object.assign({ keyPair }, DEFAULT_SWARM_OPTS, swarmOpts))
  return derived_seed
}