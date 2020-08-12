const sub = require('subleveldown')
const defer = require('promise-defer')
const reallyReady = require('hypercore-really-ready')
const ndjson = require('ndjson')
const { PassThrough } = require('stream')
const pump = require('pump')
const p2plex = require('p2plex')
const { once } = require('events')
const { seedKeygen } = require('noise-peer')
const HosterStorage = require('../hoster-storage')
const NAMESPACE = 'datdot-hoster'
const NOISE_NAME = 'noise'
const ALL_KEYS_KEY = 'all_keys'
const DEFAULT_OPTS = {
  ranges: [{ start: 0, end: Infinity }],
  watch: true
}
const ANNOUNCE = { announce: true, lookup: false }
const EncoderDecoder = require('../EncoderDecoder')

module.exports = class Hoster {
  constructor ({
    db,
    sdk,
    EncoderDecoder
  }) {
    this.storages = new Map()
    this.keyOptions = new Map()
    this.watchingFeeds = new Set()
    this.loaderCache = new Map()

    this.db = db
    this.hosterDB = sub(this.db, 'hoster', { valueEncoding: 'binary' })

    const { Hypercore } = sdk
    this.sdk = sdk
    this.Hypercore = Hypercore
    this.EncoderDecoder = EncoderDecoder
  }

  async addFeed ({feedKey, attestorKey, plan}) {
    await this.setOpts(feedKey, plan)
    await this.addKey(feedKey, plan)
    await this.loadFeedData(feedKey)
    await this.getEncodedDataFromAttestor(attestorKey, feedKey)
  }

  async getEncodedDataFromAttestor (attestorKey, key) {
    // TODO: Derive key by combining our public keys and feed key
    const feed = this.Hypercore(key, { sparse: true })
    const topic = key
    const peer = await this.communication.findByTopicAndPublicKey(topic, attestorKey, ANNOUNCE)
    const resultStream = new PassThrough({ objectMode: true })
    const rawResultStream = ndjson.parse()
    const confirmStream = ndjson.serialize()

    const verifiedStream = peer.receiveStream(topic)

    pump(confirmStream, verifiedStream, rawResultStream, resultStream)

    for await (const message of resultStream) {
      // @TODO: decode and verify each chunk (to see if it belongs to the feed) && verify the signature
      const { type } = message
      if (type === 'verified') {
        const { feed, index, encoded, proof, nodes, signature } = message

        const key = Buffer.from(feed)
        const isExisting = await this.hasKey(key)

        // Fix up the JSON serialization by converting things to buffers
        for (const node of nodes) {
          node.hash = Buffer.from(node.hash)
        }

        if (!isExisting) return sendError('UNKNOWN_FEED', { key: key.toString('hex') })
        try {
          await this.storeEncoded(
            key,
            index,
            Buffer.from(proof),
            Buffer.from(encoded),
            nodes,
            Buffer.from(signature)
          )

          confirmStream.write({
            type: 'encoded:stored',
            ok: true
          })

          // this.emit('encoded', key, index)
        } catch (e) {
          // Uncomment for better stack traces
          console.log(`ERROR_STORING: ${e.message}`)
          sendError(`ERROR_STORING: ${e.message}`, { e })
        }
      } else {
        console.log('UNKNOWN_MESSAGE', { messageType: type })
        sendError('UNKNOWN_MESSAGE', { messageType: type })
      }
    }

    function sendError (message, details = {}) {
      confirmStream.end({
        type: 'encoded:error',
        error: message,
        ...details
      })
    }
  }

  async removeFeed (key) {
    const stringKey = key.toString('hex')
    if (this.storages.has(stringKey)) {
      const storage = await this.getStorage(key)
      await storage.destroy()
    }
    await this.set
    await this.removeKey(key)
  }

  async loadFeedData (key) {
    const stringKey = key.toString('hex')

    const deferred = defer()

    // If we're already loading this feed, queue up our promise after the current one
    if (this.loaderCache.has(stringKey)) {
      // Get the existing promise for the loader
      const existing = this.loaderCache.get(stringKey)

      // Create a new promise that will resolve after the previous one and
      this.loaderCache.set(stringKey, existing.then(() => deferred.promise))

      // Wait for the existing loader to resolve
      await existing
    } else {
      // If the feed isn't already being loaded, set this as the current loader
      this.loaderCache.set(stringKey, deferred.promise)
    }

    try {
      const { ranges, watch } = await this.getOpts(key)
      const storage = await this.getStorage(key)

      const { feed } = storage

      await feed.ready()

      const { length } = feed
      for (const { start, wantedEnd } of ranges) {
        const end = Math.min(wantedEnd, length)
        feed.download({
          start,
          end
        })
      }

      if (watch) this.watchFeed(feed)

      this.loaderCache.delete(stringKey)
      deferred.resolve()
    } catch (e) {
      this.loaderCache.delete(stringKey)
      deferred.reject(e)
    }
  }

  async watchFeed (feed) {
    console.warn('Watching is not supported since we cannot ask the chain for attestors')
    /* const stringKey = feed.key.toString('hex')
    if (this.watchingFeeds.has(stringKey)) return
    this.watchingFeeds.add(stringKey)

    feed.on('update', onUpdate)

    async function onUpdate () {
      await this.loadFeedData(feed.key)
    } */
  }

  async storeEncoded (key, index, proof, encoded, nodes, signature) {
    const storage = await this.getStorage(key)
    return storage.storeEncoded(index, proof, encoded, nodes, signature)
  }

  async getStorageChallenge (key, index) {
    const storage = await this.getStorage(key)
    return storage.getStorageChallenge(index)
  }

  async sendStorageChallenge ({storageChallengeID, feedKey, attestorKey, proofs}) {
    const topic = feedKey
    const peer = await this.communication.findByTopicAndPublicKey(topic, attestorKey, { announce: false, lookup: true })
    const resultStream = ndjson.serialize()
    const confirmStream = ndjson.parse()

    const encodingStream = peer.createStream(topic)
    pump(resultStream, encodingStream, confirmStream)
    // @TODO add event signature in ext message after chunk x

    resultStream.write({
      type: 'StorageChallenge',
      feedKey,
      storageChallengeID,
      proofs
    })
    // --------------------------------------------------------------

    // Wait for the attestor to tell us they've handled the data
    // TODO: Set up timeout for when peer doesn't respond to us
    const [response] = await once(confirmStream, 'data')

    if (response.error) {
      throw new Error(response.error)
      // @TODO what happens if proof doesn't get verified due to an error? Try again?
    }
  }


  async hasKey (key) {
    const stringKey = key.toString('hex')
    return this.storages.has(stringKey)
  }

  async getStorage (key) {
    const stringKey = key.toString('hex')
    if (this.storages.has(stringKey)) {
      return this.storages.get(stringKey)
    }

    const feed = this.Hypercore(key, { sparse: true })
    const db = sub(this.db, stringKey)

    await reallyReady(feed)

    const storage = new HosterStorage(this.EncoderDecoder, db, feed)

    this.storages.set(stringKey, storage)

    return storage
  }

  async listKeys () {
    try {
      const keys = await this.hosterDB.get(ALL_KEYS_KEY)

      return keys
    } catch {
      // Must not have any keys yet
      return []
    }
  }

  async saveKeys (keys) {
    await this.hosterDB.put(ALL_KEYS_KEY, keys)
  }

  async addKey (key, options) {
    const stringKey = key.toString('hex')
    const existing = await this.listKeys()
    const data = { key: stringKey, options }
    const final = existing.concat(data)
    await this.saveKeys(final)
  }

  async removeKey (key) {
    const stringKey = key.toString('hex')
    const existing = await this.listKeys()

    const final = existing.filter((data) => data.key !== stringKey)

    await this.saveKeys(final)
  }

  async setOpts (key, options) {
    const stringKey = key.toString('hex')
    this.keyOptions.set(stringKey, options)
  }

  async getOpts (key) {
    const stringKey = key.toString('hex')
    return this.keyOptions.get(stringKey) || DEFAULT_OPTS
  }

  async init () {
    const noiseSeed = await this.sdk.deriveSecret(NAMESPACE, NOISE_NAME)
    const noiseKeyPair = seedKeygen(noiseSeed)

    this.publicKey = noiseKeyPair.publicKey

    this.communication = p2plex({ keyPair: noiseKeyPair })

    const keys = await this.listKeys()

    for (const { key, options } of keys) {
      await this.setOpts(key, options)
      await this.getStorage(key)
      await this.loadFeedData(key)
    }
  }

  static async load (opts) {
    const hoster = new Hoster(opts)

    await hoster.init()

    return hoster
  }

  async close () {
    await this.communication.destroy()
    // Close the DB and hypercores
    for (const storage of this.storages.values()) {
      await storage.close()
    }
  }
}
