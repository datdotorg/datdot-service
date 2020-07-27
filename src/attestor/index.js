const delay = require('delay')
const debug = require('debug')
const p2plex = require('p2plex')
const { seedKeygen } = require('noise-peer')
const pump = require('pump')
const ndjson = require('ndjson')
const { PassThrough } = require('stream')
const NAMESPACE = 'datdot-attestor'
const NOISE_NAME = 'noise'

const DEFAULT_TIMEOUT = 5000
const DEFAULT_LOCATION = 0
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

  async listenEncoder (encoderKey, key, cb) {
    // TODO: Derive key by combining our public keys and feed key
    const feed = this.Hypercore(key, { sparse: true })
    const topic = key
    const peer = await this.communication.findByTopicAndPublicKey(topic, encoderKey, ANNOUNCE)
    const resultStream = new PassThrough({ objectMode: true })
    const rawResultStream = ndjson.parse()
    const confirmStream = ndjson.serialize()
    const encodingStream = peer.receiveStream(topic)

    pump(confirmStream, encodingStream, rawResultStream, resultStream)

    for await (const message of resultStream) {
      const { type } = message
      if (type === 'encoded') {
        const { feed, index, encoded, proof, nodes, signature } = message
        cb(message, (err, res) => {
          // 1. IF error => sendError and END confirm stream
          if (err) sendError('INVALID_COMPRESSION', { messageIndex: message.index })
          // 2. IF no error => WRITE to confirm stream that its successfully checked
          else if (!err) {
            console.log(`${res.index} by ${encoderKey.toString('hex')} OK`)
            confirmStream.write({
              type: 'encoded:checked',
              ok: true
            })
          }
          // 3. IF last chunk =< WRITE to confirm stream that its successfully checked AND end the confirmStream successfully => JOB done
        })
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

  async attest (key, index) {
    const feed = this.Hypercore(key, { persist: false })
    try {
      const start = Date.now()

      await Promise.race([
        feed.get(index),
        delay(this.timeout).then(() => {
          throw new Error('Timed out')
        })
      ])

      const end = Date.now()
      const latency = end - start

      // TODO: Figure out how locations should work?
      const location = DEFAULT_LOCATION

      return [location, latency]
    } catch (e) {
      this.debug(`Error: ${key}@${index} ${e.message}`)
      return [DEFAULT_LOCATION, null]
    } finally {
      await feed.close()
    }
  }
}
