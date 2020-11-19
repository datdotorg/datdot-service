const p2plex = require('p2plex')
const sub = require('subleveldown')
const defer = require('promise-defer')
const reallyReady = require('hypercore-really-ready')
const { seedKeygen } = require('noise-peer')

const HosterStorage = require('./hoster-storage')
const peerConnect = require('../p2plex-connection')
const requestResponse = require('../requestResponse')

const NAMESPACE = 'datdot-hoster'
const NOISE_NAME = 'noise'
const ALL_KEYS_KEY = 'all_keys'
const DEFAULT_OPTS = { ranges: [{ start: 0, end: Infinity }], watch: true }
const DEFAULT_TIMEOUT = 5000

module.exports = class Hoster {
  constructor ({ db, sdk, EncoderDecoder }, log) {
    const { Hypercore } = sdk
    this.log = log
    this.storages = new Map()
    this.keyOptions = new Map()
    this.watchingFeeds = new Set()
    this.loaderCache = new Map()
    this.db = db
    this.hosterDB = sub(this.db, 'hoster')
    this.sdk = sdk
    this.Hypercore = Hypercore
    this.EncoderDecoder = EncoderDecoder
  }

  async init () {
    const noiseSeed = await this.sdk.deriveSecret(NAMESPACE, NOISE_NAME)
    const noiseKeyPair = seedKeygen(noiseSeed)
    this.communication = p2plex({ keyPair: noiseKeyPair })
    this.publicKey = noiseKeyPair.publicKey
    const keys = await this.listKeys()
    for (const { key, options } of keys) {
      await this.setOpts(key, options)
      await this.getStorage(key)
      await this.loadFeedData(key)
    }
  }

  static async load (opts, log) {
    const hoster = new Hoster(opts, log)
    await hoster.init()
    return hoster
  }

  async hostFor ({ amendmentID, feedKey, hosterKey, attestorKey, plan }) {
    await this.setOpts(feedKey, plan)
    await this.addKey(feedKey, plan)
    await this.loadFeedData(feedKey)
    await this.getEncodedDataFromAttestor(amendmentID, hosterKey, attestorKey, feedKey)
    this.log({ type: 'hoster', body: ['All done'] })
  }

  async getEncodedDataFromAttestor (amendmentID, hosterKey, attestorKey, feedKey) {
    const hoster = this
    return new Promise(async (resolve, reject) => {
      const opts = {
        plex: hoster.communication,
        senderKey: attestorKey,
        feedKey,
        receiverKey: hosterKey,
        id: amendmentID,
        myKey: hosterKey,
      }
      var counter = 0
      const log2attestor = hoster.log.sub(`<-Attestor ${attestorKey.toString('hex').substring(0,5)}`)
      const streams = await peerConnect(opts, log2attestor)

      for await (const message of streams.parse$) {
        // log2attestor(message.index, 'RECV_MSG',attestorKey.toString('hex'))
        counter++
        // @TODO: decode and merkle verify each chunk (to see if it belongs to the feed) && verify the signature
        const { type } = message
        if (type === 'ping') continue
        if (type === 'verified') {
          const { feed, index, encoded, proof, nodes, signature } = message
          const key = Buffer.from(feed)
          const isExisting = await hoster.hasKey(key)
          // Fix up the JSON serialization by converting things to buffers
          for (const node of nodes) node.hash = Buffer.from(node.hash)
          if (!isExisting) {
            const error = { type: 'encoded:error', error: 'UNKNOWN_FEED', ...{ key: key.toString('hex') } }
            streams.serialize$.write(error)
            streams.end()
            return reject(error)
          }
          try {
            const data = {
              key,
              index,
              proof: Buffer.from(proof),
              encoded: Buffer.from(encoded),
              nodes,
              signature: Buffer.from(signature)
            }
            await hoster.storeEncoded(data)
            // log2attestor(index, ':stored', index)
            // log2attestor(index, ':attestor:MSG',attestorKey.toString('hex'))
            streams.serialize$.write({ type: 'encoded:stored', ok: true, index: message.index })
          } catch (e) {
            // Uncomment for better stack traces
            const error = { type: 'encoded:error', error: `ERROR_STORING: ${e.message}`, ...{ e }, data }
            streams.serialize$.write(error)
            log2attestor({ type: 'error', body: [`Error: ${error}`] })
            streams.end()
            return reject(error)
          }
        } else {
          log2attestor({ type: 'error', body: [`UNKNOWN_MESSAGE messageType: ${type}`] })
          const error ={ type: 'encoded:error', error: 'UNKNOWN_MESSAGE', ...{ messageType: type } }
          streams.serialize$.write(error)
          streams.end()
          return reject(error)
        }
      }
      log2attestor({ type: 'hoster', body: [`Hoster received & stored all: ${counter}`] })
      resolve()
    })
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
        feed.download({ start, end })
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
    this.warn('Watching is not supported since we cannot ask the chain for attestors')
    /* const stringKey = feed.key.toString('hex')
    if (this.watchingFeeds.has(stringKey)) return
    this.watchingFeeds.add(stringKey)
    feed.on('update', onUpdate)
    async function onUpdate () {
      await this.loadFeedData(feed.key)
    } */
  }

  async storeEncoded ({ key, index, proof, encoded, nodes, signature }) {
    const storage = await this.getStorage(key)
    return storage.storeEncoded(index, proof, encoded, nodes, signature)
  }

  async getStorageChallenge (key, index) {
    const storage = await this.getStorage(key)
    return storage.getStorageChallenge(index)
  }

  async sendStorageChallenge ({ storageChallenge, hosterKey, feedKey, attestorKey }) {
    const hoster = this
    hoster.log({ type: 'hoster', body: [`Starting sendStorageChallenge`] })
    const storageChallengeID = storageChallenge.id
    const chunks = storageChallenge.chunks
    // console.log('CHUNKS', chunks)
    return new Promise(async (resolve, reject) => {
      const opts = {
        plex: hoster.communication,
        senderKey: hosterKey,
        feedKey,
        receiverKey: attestorKey,
        id: storageChallengeID,
        myKey: hosterKey,
      }
      const log2attestor4Challenge = hoster.log.sub(`<-Attestor4challenge ${attestorKey.toString('hex').substring(0,5)}`)
      const streams = await peerConnect(opts, log2attestor4Challenge)


      const all = []
      for (var i = 0; i < chunks.length; i++) {
        const index = chunks[i]
        const data = await hoster.getStorageChallenge(feedKey, index)
        // console.log('Got data for', index)
        const message = { type: 'StorageChallenge', feedKey, storageChallengeID, data}
        message.index = i
        log2attestor4Challenge({ type: 'hoster', body: [`Sending proof of storage chunk ${chunks[i]}, message index: ${message.index}`] })
        const dataSent = requestResponse({ message, sendStream: streams.serialize$, receiveStream: streams.parse$, log: log2attestor4Challenge })
        all.push(dataSent)
      }
      try {
        const results = await Promise.all(all).catch((error) => log2attestor4Challenge({ type: 'error', body: [`error: ${error}`] }))
        log2attestor4Challenge({ type: 'hoster', body: [`${all.length} responses received from the attestor`] })
        log2attestor4Challenge({ type: 'hoster', body: [`Destroying communication with the attestor`] })
        streams.end()
        resolve(results)
      } catch (e) {
        log2attestor4Challenge({ type: 'error', body: [`Error: ${e}`] })
        reject(e)
      }

    })
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
    const db = sub(this.db, stringKey, { valueEncoding: 'binary' })
    await reallyReady(feed)
    const storage = new HosterStorage({ EncoderDecoder: this.EncoderDecoder, db, feed, log: this.log })
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

  async close () {
    // await this.communication.destroy()
    // Close the DB and hypercores
    for (const storage of this.storages.values()) {
      await storage.close()
    }
  }
}
