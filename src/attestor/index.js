const delay = require('delay')
const debug = require('debug')
const p2plex = require('p2plex')
const { seedKeygen } = require('noise-peer')
const pump = require('pump')
const { once } = require('events')
const ndjson = require('ndjson')
const { PassThrough } = require('stream')
const NAMESPACE = 'datdot-attestor'
const NOISE_NAME = 'noise'
const {performance} = require('perf_hooks')

const DEFAULT_TIMEOUT = 5000
const ANNOUNCE = { announce: true, lookup: false }
let attestorCount = 0

module.exports = class Attestor {
  constructor ({ sdk, timeout = DEFAULT_TIMEOUT }) {
    const { Hypercore } = sdk
    this.Hypercore = Hypercore
    this.sdk = sdk
    this.timeout = timeout
    this.debug = debug(`datdot:attestor:${attestorCount++}`)
  }

  static async load (opts) {

    const attestor = new Attestor(opts)
    await attestor.init()
    return attestor
  }

  async init () {
    const noiseSeed = await this.sdk.deriveSecret(NAMESPACE, NOISE_NAME)
    const noiseKeyPair = seedKeygen(noiseSeed)

    this.publicKey = noiseKeyPair.publicKey

    this.communication = p2plex({ keyPair: noiseKeyPair })
  }

  async verifyEncoding (opts) {
    const { encoderKey, hosterKey, feedKey: key, cb: compareEncodings } = opts
    const attestor = this

    // TODO: Derive key by combining our public keys and feed key
    const topic = key
    const peer = await attestor.communication.findByTopicAndPublicKey(topic, encoderKey, ANNOUNCE)
    const resultStream = new PassThrough({ objectMode: true })
    const rawResultStream = ndjson.parse()
    const confirmStream = ndjson.serialize()
    const encoderStream = peer.receiveStream(topic)
    pump(confirmStream, encoderStream, rawResultStream, resultStream)

    const hoster = await attestor.communication.findByTopicAndPublicKey(topic, hosterKey, { announce: false, lookup: true })
    const receiveStream = new PassThrough({ objectMode: true })
    const rawReceiveStream = ndjson.parse()

    const sendStream = ndjson.serialize()
    const hosterStream = hoster.createStream(topic)
    pump(sendStream, hosterStream, rawReceiveStream, receiveStream)

    for await (const message of resultStream) {
      // @TODO: verify each chunk
      const { type } = message
      if (type === 'encoded') {
        const { feed, index, encoded, proof, nodes, signature } = message

        compareEncodings(message, (err, res) => {
          if (!err) {
            confirmStream.write({
              type: 'encoded:checked',
              ok: true
            })
            sendToHoster(message)
          }
          else if (err) sendError('INVALID_COMPRESSION', { messageIndex: message.index })
        })
      } else {
        this.debug('UNKNOWN_MESSAGE', { messageType: type })
        sendError('UNKNOWN_MESSAGE', { messageType: type })
      }
    }
    hosterStream.end()

    async function sendToHoster (message) {
      const { type, feed, index, encoded, proof, nodes, signature } = message
      if (type === 'encoded') {
        sendStream.write({
          type: 'verified',
          feed,
          index,
          encoded,
          proof,
          nodes,
          signature
        })

        // Wait for the hoster to tell us they've handled the data
        // TODO: Set up timeout for when peer doesn't respond to us
        const [response] = await once(receiveStream, 'data')
        console.log('Response', response)
        if (response.error) throw new Error(response.error)
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

  async verifyStorageChallenge (data) {
    const {hosterKey, feedKey, storageChallengeID: id} = data
    // TODO: Derive topic by combining our public keys and feed key
    const topic = feedKey
    const peer = await this.communication.findByTopicAndPublicKey(topic, hosterKey, ANNOUNCE)
    const resultStream = new PassThrough({ objectMode: true })
    const rawResultStream = ndjson.parse()
    const confirmStream = ndjson.serialize()
    const hosterStream = peer.receiveStream(topic)
    pump(confirmStream, hosterStream, rawResultStream, resultStream)

    for await (const message of resultStream) {
      const { type } = message
      if (type === 'StorageChallenge') {
        const { feedKey, storageChallengeID, proofs} = message
        if (id === storageChallengeID) {
          this.debug('storageChallengeIDs match')
          // @TODO: verify each chunk (to see if it belongs to the feed) && verify the signature
          // @TODO: check the proof
          // @TODO: hash the data
          if (proofs) {
            confirmStream.write({
              type: 'StorageChallenge:verified',
              ok: true
            })
            return message
          }
        }
      } else {
        this.debug('UNKNOWN_MESSAGE', { messageType: type })
        sendError('UNKNOWN_MESSAGE', { messageType: type })
        return false
      }
    }

    function sendError (message, details = {}) {
      confirmStream.end({
        type: 'StorageChallenge:error',
        error: message,
        ...details
      })
    }
  }

  async attest (key, index) {
    const feed = this.Hypercore(key, { persist: false })
    try {
      const start = performance.now()
      await Promise.race([
        feed.get(index),
        delay(this.timeout).then(() => {
          throw new Error('Timed out')
        })
      ])

      const end = performance.now()
      const latency = end - start
      const foo = await feed.get(index)
      this.debug(foo.toString())
      const stats = await getFeedStats(feed)
      // this.debug(`Stats for feed: ${key.toString('hex')}, index: ${index}, attestor: ${attestor.publicKey.toString('hex')} => ${JSON.stringify(stats)}`)
      return [stats, latency]
    } catch (e) {
      this.debug(`Error: ${key}@${index} ${e.message}`)
      this.debug(e)
      return [null, null]
    } finally {
      await feed.close()
    }

    async function getFeedStats (feed) {
      if (!feed) return {}
      const stats = feed.stats
      const openedPeers = feed.peers.filter(p => p.remoteOpened)
      const networkingStats = {
        key: feed.key,
        discoveryKey: feed.discoveryKey,
        peerCount: feed.peers.length,
        peers: openedPeers.map(p => {
          return {
            ...p.stats,
            remoteAddress: p.remoteAddress
          }
        })
      }
      return {
        ...networkingStats,
        uploadedBytes: stats.totals.uploadedBytes,
        uploadedChunks: stats.totals.uploadedBlocks,
        downloadedBytes: stats.totals.downloadedBytes,
        downloadedChunks: feed.downloaded(),
        totalBlocks: feed.length
      }
    }

  }


}
