const delay = require('delay')
const debug = require('debug')
const p2plex = require('p2plex')
const { seedKeygen } = require('noise-peer')
const pump = require('pump')
const ndjson = require('ndjson')
const NAMESPACE = 'datdot-attestor'
const NOISE_NAME = 'noise'

const DEFAULT_TIMEOUT = 5000
const DEFAULT_LOCATION = 0

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
