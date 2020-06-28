const delay = require('delay')
const debug = require('debug')

const DEFAULT_TIMEOUT = 5000
const DEFAULT_LOCATION = 0

let attestorCount = 0

module.exports = class Attestor {
  constructor ({ sdk, timeout = DEFAULT_TIMEOUT }) {
    const { Hypercore } = sdk
    this.Hypercore = Hypercore
    this.timeout = timeout
    this.debug = debug(`datdot:attestor:${attestorCount++}`)
  }

  static load (opts) {
    return new Attestor(opts)
  }

  async attest (key, index) {
    this.debug(`Attesting: ${key}@${index}`)
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

      this.debug(`Attested ${key}@${index}: ${latency}`)

      return [location, latency]
    } catch (e) {
      this.debug(`Error: ${key}@${index} ${e.message}`)
      return [DEFAULT_LOCATION, null]
    } finally {
      await feed.close()
    }
  }
}
