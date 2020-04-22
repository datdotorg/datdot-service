const HosterStorage = require('../hoster-storage')
const sub = require('subleveldown')
const defer = require('promise-defer')
const reallyReady = require('hypercore-really-ready')

const ALL_KEYS_KEY = 'all_keys'
const DEFAULT_OPTS = {
  ranges: [{ start: 0, end: Infinity }],
  watch: true
}

module.exports = class Hoster {
  constructor ({
  	db,
  	sdk,
  	EncoderDecoder,
  	onNeedsEncoding,
  	communication
  }) {
    this.storages = new Map()
    this.keyOptions = new Map()
    this.watchingFeeds = new Set()
    this.loaderCache = new Map()

    this.db = db
    this.hosterDB = sub(this.db, 'hoster', { valueEncoding: 'json' })

		const {Hypercore} = sdk
		this.sdk = sdk
    this.Hypercore = Hypercore
    this.EncoderDecoder = EncoderDecoder
    this.communication = communication
    this.onNeedsEncoding = onNeedsEncoding
  }

  async addFeed (key, opts) {
    await this.setOpts(key, opts)
    await this.addKey(key, opts)
    await this.loadFeedData(key)
  }

  // TODO: Should we verify that the peer can be trusted?
  async onMessage (message, peer) {
    const { type } = message

    if (type === 'encoded') {
      const { feed, index, encoded, proof } = message

      const key = Buffer.from(feed)

      const isExisting = await this.hasKey(key)

      if (!isExisting) return sendError('UNKNOWN_FEED', { key: key.toString('hex') })
      try {
        await this.storeEncoded(key, index, Buffer.from(proof), Buffer.from(encoded))

        peer.send({
          type: 'encoded:stored',
          ok: true
        })
      } catch (e) {
      	// Uncomment for better stack traces
      	// console.error(e)
        sendError(`ERROR_STORING: ${e.message}`, { e })
      }
    } else {
      sendError('UNKNOWN_MESSAGE', { messageType: type })
    }

    function sendError (message, details = {}) {
      peer.send({
        type: 'encoded:error',
        error: message,
        ...details
      })

      peer.close()
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

      for (const { start, end } of ranges) {
        const actualEnd = Math.min(end, length)
        for (let i = start; i < actualEnd; i++) {
          if (feed.has(i)) continue

          await this.onNeedsEncoding(key, i)
        }
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
    const stringKey = feed.key.toString('hex')
    if (this.watchingFeeds.has(stringKey)) return
    this.watchingFeeds.add(stringKey)

    feed.on('update', onUpdate)

    async function onUpdate () {
      await this.loadFeedData(feed.key)
    }
  }

  async storeEncoded (key, index, proof, encoded) {
    const storage = await this.getStorage(key)

    return storage.storeEncoded(index, proof, encoded)
  }

  async getProofOfStorage (key, index) {
    const storage = await this.getStorage(key)

    return storage.getProofOfStorage
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

  async getOpts (key, options) {
    const stringKey = key.toString('hex')
    return this.keyOptions.get(stringKey) || DEFAULT_OPTS
  }

  async init () {
    this.communication.on('message', (message, peer) => this.onMessage(message, peer))

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
    // Close the DB and hypercores
    for (const storage of this.storages.values()) {
      await storage.close()
    }
  }
}
