const delay = require('delay')
const p2plex = require('p2plex')
const { seedKeygen } = require('noise-peer')
const { performance } = require('perf_hooks')

const peerConnect = require('../peer-connection')

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
    this.noiseKeyPair = noiseKeyPair
    this.publicKey = noiseKeyPair.publicKey
  }

  async verifyEncodingFor (opts) {
    const attestor = this
    return new Promise(async (resolve, reject) => {
      const { contractID, attestorKey, encoderKey, hosterKey, feedKey, cb: compare } = opts

      const opts1 = {
        comm: p2plex({ keyPair: attestor.noiseKeyPair }),
        senderKey: encoderKey,
        feedKey,
        receiverKey: attestorKey,
        id: contractID,
        myKey: attestorKey,
      }
      const log2encoder = attestor.log.extend('<-Encoder')
      const encoderComm = await peerConnect(opts1, log2encoder)
      const opts2 = {
        comm: p2plex({ keyPair: attestor.noiseKeyPair }),
        senderKey: attestorKey,
        feedKey,
        receiverKey: hosterKey,
        id: contractID,
        myKey: attestorKey,
      }
      console.log('@TODO: hoster')
      // const log2hoster = attestor.log.extend('->Hoster')
      // const hosterComm = await peerConnect(opts2, log2hoster)

      // check the encoded data and if ok, send them to the hosters
      const comparisons = []
      log2encoder('START COMPARING')
      for await (const message of encoderComm.parse$) {
        // log2encoder(message.index, 'RECV_MSG',encoderKey.toString('hex'))
        // @TODO: merkle verify each chunk
        const { type } = message
        if (type === 'encoded') {
          // verify if all encodings are same size
          comparisons.push(compareEncodings(message))
        } else {
          log2encoder('encoded checking unknown message', 'UNKNOWN_MESSAGE', { messageType: type })
          encoderComm.serialize$.end({ type: 'encoded:error', error: 'UNKNOWN_MESSAGE', ...{ messageType: type } })
        }
      }
      const results = await Promise.all(comparisons)
      attestor.log(results)
      attestor.log('COMPARED ENCODINGS for ALL', comparisons.length, ' RANGES:', encoderKey.toString('hex'))

      attestor.log('END COMM with ENCODER & HOSTER')
      // hosterComm.end()
      // encoderComm.end()

      resolve('YAY ' + encoderKey.toString('hex'))

      function compareEncodings (message) {
        return new Promise((resolve, reject) => {
          // log2encoder(message.index, 'COMPARE',encoderKey.toString('hex'))
          compare(message, async (err, res) => {
            if (!err) {
              // log2encoder(message.index, 'SEND_ACK',encoderKey.toString('hex'))
              encoderComm.serialize$.write({ type: 'encoded:checked', ok: true })

              console.log('@TODO: hoster')
              // try {
              //   const response = await sendToHoster(message, log2hoster)
              //   return resolve(response)
              // } catch (err) {
              //   return reject(err)
              // }
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
        return new Promise(async (resolve, reject) => {
          const { type, feed, index, encoded, proof, nodes, signature } = message
          if (type === 'encoded') {
            log2hoster(message.index, 'SEND_MSG',hosterComm.peerKey.toString('hex'))
            hosterComm.serialize$.write({
              type: 'verified',
              feed,
              index,
              encoded,
              proof,
              nodes,
              signature
            })
            var timeout
            const toID = setTimeout(() => {
              timeout = true
              encoderComm.parse$.off('data', ondata)
              const error = [message.index, 'FAIL_ACK_TIMEOUT',hosterComm.peerKey.toString('hex')]
              log2hoster(error)
              reject(error)
            }, DEFAULT_TIMEOUT)
            encoderComm.parse$.once('data', ondata)

            function ondata (response) {
              // const [response] = await once(hosterComm.parse$, 'data')
              if (timeout) return
              clearTimeout(toID)
              log2hoster(message.index, 'RECV_ACK',hosterComm.peerKey.toString('hex'))
              if (response.error) return reject(new Error(response.error))
              resolve(response)
            }

          }
        })
      }

    })
  }

  async verifyStorageChallenge (data) {
    const attestor = this
    return new Promise(async (resolve, reject) => {
      const { storageChallengeID, attestorKey, hosterKey, feedKey, storageChallengeID: id } = data

      const opts3 = {
        comm: p2plex({ keyPair: attestor.noiseKeyPair }),
        senderKey: hosterKey,
        feedKey,
        receiverKey: attestorKey,
        id: storageChallengeID,
        myKey: attestorKey,
      }
      const log2hosterChallenge = attestor.log.extend('<-HosterChallenge')
      const hosterChallengeComm = await peerConnect(opts3, log2hosterChallenge)

      for await (const message of hosterChallengeComm.parse$) {
        const { type } = message
        if (type === 'StorageChallenge') {
          const { storageChallengeID, proof } = message
          if (id === storageChallengeID) {
            // proof.encoded
            // @TODO: merkle verify each chunk (to see if it belongs to the feed) && verify the signature
            // @TODO: check the proof
            // @TODO: hash the data
            if (proof) {
              hosterChallengeComm.serialize$.write({
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
        hosterChallengeComm.serialize$.end({
          type: 'StorageChallenge:error',
          error: message,
          ...details
        })
      }
      resolve()
    })
  }

  async checkPerformance (key, index) {
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

//
// process.on('unhandledRejection', error => {
//   console.log('unhandledRejection', error)
// })
// process.on('uncaughtException', (err, origin) => {
//   console.log('uncaughtException', err, origin)
// })
// process.on('warning', error => {
//   const stack = error.stack
//   console.log('warning', error)
//   console.log(stack)
// })
// process.setMaxListeners(0)
