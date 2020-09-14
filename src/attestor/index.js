const delay = require('delay')
const p2plex = require('p2plex')
const { seedKeygen } = require('noise-peer')
const { performance } = require('perf_hooks')

const peerConnect = require('../p2plex-connection')
const requestResponse = require('../requestResponse')

const NAMESPACE = 'datdot-attestor'
const NOISE_NAME = 'noise'
const DEFAULT_TIMEOUT = 5000

module.exports = class Attestor {
  constructor ({ sdk, timeout = DEFAULT_TIMEOUT }, log) {
    this.log = log
    const { Hypercore } = sdk
    this.Hypercore = Hypercore
    this.sdk = sdk
    this.timeout = timeout
  }
  static async load (opts, log) {
    const attestor = new Attestor(opts, log)
    await attestor.init()
    return attestor
  }
  async init () {
    const noiseSeed = await this.sdk.deriveSecret(NAMESPACE, NOISE_NAME)
    const noiseKeyPair = seedKeygen(noiseSeed)
    this.communication = p2plex({ keyPair: noiseKeyPair })
    this.communication.on('connection', (peer) => { this.log('New connection') })
    this.publicKey = noiseKeyPair.publicKey
  }

/* ----------------------------------------------------------------------
                            VERIFY ENCODING
---------------------------------------------------------------------- */

  async verifyEncodingFor (opts) {
    const attestor = this
    return new Promise(async (resolve, reject) => {
      const { contractID, attestorKey, encoderKey, hosterKey, feedKey, cb: compare } = opts

      const opts1 = {
        plex: this.communication,
        senderKey: encoderKey,
        feedKey,
        receiverKey: attestorKey,
        id: contractID,
        myKey: attestorKey,
      }
      const log2encoder = attestor.log.sub(`<-Encoder ${encoderKey.toString('hex').substring(0,5)}`)
      const encoderComm = await peerConnect(opts1, log2encoder)
      const opts2 = {
        plex: this.communication,
        senderKey: attestorKey,
        feedKey,
        receiverKey: hosterKey,
        id: contractID,
        myKey: attestorKey,
      }
      // console.log('@TODO: hoster')
      const log2hoster = attestor.log.sub(`->Hoster ${hosterKey.toString('hex').substring(0,5)}`)
      const streams = await peerConnect(opts2, log2hoster)

      // check the encoded data and if ok, send them to the hosters
      const verifiedAndStored = []
      log2encoder('Start receiving data from the encoder')

      for await (const message of encoderComm.parse$) {
        log2encoder(message.index, 'RECV_MSG', encoderKey.toString('hex'))
        // @TODO: merkle verify each chunk
        const { type } = message
        if (type === 'ping') continue
        if (type === 'encoded') {
          // verify if all encodings are same size
          verifiedAndStored.push(compareEncodings(message))
        } else {
          log2encoder('encoded checking unknown message', 'UNKNOWN_MESSAGE', { messageType: type })
          encoderComm.serialize$.end({ type: 'encoded:error', error: 'UNKNOWN_MESSAGE', ...{ messageType: type } })
        }
      }
      const results = await Promise.all(verifiedAndStored).catch((error) => attestor.log(error))
      // console.log('@TODO: hoster')
      streams.end()
      resolve(`All data from encoder: ${encoderKey.toString('hex')} verified and sent to the hoster: ${hosterKey.toString('hex')}`)

      function compareEncodings (message) {
        return new Promise((resolve, reject) => {
          compare(message, async (err, res) => {
            if (!err) {
              log2encoder(message.index, 'SEND_ACK',encoderKey.toString('hex'))
              encoderComm.serialize$.write({ type: 'encoded:checked', ok: true, index: message.index })
              // console.log('@TODO: hoster')
              try {
                const response = await sendToHoster(message, log2hoster)
                return resolve(response)
              } catch (err) {
                // attestor.log('@TODO: hoster response timed out, how to deal with these errors?')
                return reject(err)
              }
              resolve([message.index, encoderKey.toString('hex')])
            } else if (err) {
              log2encoder('encoded checking error')
              encoderComm.serialize$.end({ type: 'encoded:error', error: 'INVALID_COMPRESSION', ...{ messageIndex: message.index } })
              return reject(err)
            }
          })
        })
      }
      async function sendToHoster (message, log2hoster) {
        const { type, feed, index, encoded, proof, nodes, signature } = message
        if (type !== 'encoded') return log('Type not encoded, not sending to the hoster')
        const msg = { type: 'verified', feed, index, encoded, proof, nodes, signature }
        return requestResponse({ message: msg, sendStream: streams.serialize$, receiveStream: streams.parse$, log: log2hoster })
      }

    })
  }

  /* ----------------------------------------------------------------------
                          VERIFY STORAGE CHALLENGE
  ---------------------------------------------------------------------- */

  async verifyStorageChallenge (data) {
    const attestor = this
    return new Promise(async (resolve, reject) => {
      const { storageChallengeID, attestorKey, hosterKey, feedKey, storageChallengeID: id } = data

      const opts3 = {
        plex: this.communication,
        senderKey: hosterKey,
        feedKey,
        receiverKey: attestorKey,
        id: storageChallengeID,
        myKey: attestorKey,
      }
      const log2hosterChallenge = attestor.log.sub(`<-HosterChallenge ${hosterKey.toString('hex').substring(0,5)}`)
      const streams = await peerConnect(opts3, log2hosterChallenge)

      for await (const message of streams.parse$) {
        const { type } = message
        if (type === 'StorageChallenge') {
          const { storageChallengeID, proof } = message
          if (id === storageChallengeID) {
            // proof.encoded
            // @TODO: merkle verify each chunk (to see if it belongs to the feed) && verify the signature
            // @TODO: check the proof
            // @TODO: hash the data
            if (proof) {
              streams.serialize$.write({
                type: 'StorageChallenge:verified',
                ok: true
              })
              resolve(proof)
              // return hash, challengeID, signature of the event
              // does hoster send a hash or does attestor decode and then hash?
            }
          }
        } else {
          attestor.log('UNKNOWN_MESSAGE', { messageType: type })
          sendError('UNKNOWN_MESSAGE', { messageType: type })
          reject()
        }
      }

      function sendError (message, details = {}) {
        streams.serialize$.end({
          type: 'StorageChallenge:error',
          error: message,
          ...details
        })
      }
      resolve()
    })
  }

  /* ----------------------------------------------------------------------
                          CHECK PERFORMANCE
  ---------------------------------------------------------------------- */

  async checkPerformance (key, index) { // key = feedkey, index = chunk index
    return new Promise(async (resolve, reject) => {
      const feed = this.Hypercore(key, { persist: false })
      try {
        const start = performance.now()
        await Promise.race([
          feed.get(index),
          delay(this.timeout).then(() => { throw new Error('Timed out') })
        ])
        const end = performance.now()
        const latency = end - start
        const stats = await getFeedStats(feed)
        resolve([stats, latency])
      } catch (e) {
        this.log(`Error: ${key}@${index} ${e.message}`)
        reject()
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
            return { ...p.stats, remoteAddress: p.remoteAddress }
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
    })
  }



}
