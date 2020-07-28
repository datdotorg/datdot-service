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

  async listenEncoder (opts) {
    const { encoderKey, hosterKey, feedKey: key, cb } = opts
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
      const { type } = message
      if (type === 'encoded') {
        const { feed, index, encoded, proof, nodes, signature } = message
        cb(message, (err, res) => {
          if (err) sendError('INVALID_COMPRESSION', { messageIndex: message.index })
          else if (!err) {
            // send chunk to hoster
            sendToHoster({ message })
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
    hosterStream.end()

    async function sendToHoster ({ message }) {
      sendStream.write({
        type: 'verified',
        feed: message.feed,
        index: message.index,
        encoded: message.encoded,
        proof: message.proof,
        nodes: message.nodes,
        signature: message.signature
      })

      // Wait for the hoster to tell us they've handled the data
      // TODO: Set up timeout for when peer doesn't respond to us
      const [response] = await once(receiveStream, 'data')
      console.log('Response', response)
      if (response.error) throw new Error(response.error)
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
