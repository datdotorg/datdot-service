const delay = require('delay')
const p2plex = require('p2plex')
const { seedKeygen } = require('noise-peer')
const { performance } = require('perf_hooks')

const peerConnect = require('../p2plex-connection')
const requestResponse = require('../requestResponse')
const EncoderDecoder = require('../EncoderDecoder')
const getRangesCount = require('../getRangesCount')

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
    this.communication = p2plex({ keyPair: noiseKeyPair, maxPeers: Infinity })
    this.communication.setMaxListeners(128)
    this.communication.on('connection', (peer) => { this.log({ type: 'attestor', body: [`new connection`]}) })
    this.publicKey = noiseKeyPair.publicKey
  }

/* ----------------------------------------------------------------------
                            VERIFY ENCODING
---------------------------------------------------------------------- */

  async verifyEncodingFor (opts) {
    const attestor = this

    return new Promise(async (resolve, reject) => {
      const { amendmentID, attestorKey, encoderKey, hosterKey, ranges, feedKey, cb: compare } = opts
      const opts1 = {
        plex: this.communication,
        senderKey: encoderKey,
        feedKey,
        receiverKey: attestorKey,
        id: amendmentID,
        myKey: attestorKey,
      }
      const log2encoder = attestor.log.sub(`<-Encoder ${encoderKey.toString('hex').substring(0,5)}`)
      const encoderComm = await peerConnect(opts1, log2encoder)
      const opts2 = {
        plex: this.communication,
        senderKey: attestorKey,
        feedKey,
        receiverKey: hosterKey,
        id: amendmentID,
        myKey: attestorKey,
      }
      const log2hoster = attestor.log.sub(`->Hoster ${hosterKey.toString('hex').substring(0,5)}`)
      var id_streams2 = setTimeout(() => { log2hoster({ type: 'attestor', body: [`peerConnect timeout, ${JSON.stringify(opts2)}`] }) }, 500)
      const streams = await peerConnect(opts2, log2hoster)
      clearTimeout(id_streams2)
      // check the encoded data and if ok, send them to the hosters
      log2encoder({ type: 'attestor', body: ['Start receiving data from the encoder'] })

      // set timeout
      const verified = []
      const verifiedAndStored = []
      const expectedMessageCount = getRangesCount(ranges)
      var encodedCount = 0
      const failed = []
      var timeout
      var timeoutID = setTimeout(() => {
        if (verified.length !== expectedMessageCount) {
          console.log('Encoder failed',  verified.length, expectedMessageCount)
          failed.push(encoderKey)
        }
        resolve(failed)
        timeout = true
        streams.end()
      }, 11000)

      for await (const message of encoderComm.parse$) {
        log2encoder({ type: 'attestor', body: [`${message.index} RECV_MSG ${encoderKey.toString('hex')}`] })
        encodedCount++
        // @TODO: merkle verify each chunk
        const { type } = message
        if (type === 'ping') continue
        if (type === 'encoded') {
          // verify if all encodings are same size
          verified.push({ message})
          verifiedAndStored.push(compareEncodings(message))
        } else {
          log2encoder({ type: 'attestor', body: [`encoded checking UNKNOWN_MESSAGE MESSAGE TYPE ${type} `] })
          encoderComm.serialize$.end({ type: 'encoded:error', error: 'UNKNOWN_MESSAGE', ...{ messageType: type } })
        }
      }
      // prepare the report
      if (timeout) return
      else clearTimeout(timeoutID)
      const results = await Promise.allSettled(verifiedAndStored).catch((error) => console.log({ type: 'error', body: [`Error: ${error}`] }))
      const status = this.getStatus(results)
      if (!status) {
        console.log(`Hoster failed (${verified.length}/${expectedMessageCount})`)
        log2encoder({ type: 'attestor', body: [`Hoster failed (${verified.length}/${expectedMessageCount})`] })
        failed.push(hosterKey)
      }
      streams.end()
      resolve(failed)

      function compareEncodings (message) {
        return new Promise((resolve, reject) => {
          compare(message, async (err, res) => {
            if (!err) {
              log2encoder({ type: 'attestor', body: [`${message.index} SEND_ACK ${encoderKey.toString('hex')}`] })
              encoderComm.serialize$.write({ type: 'encoded:checked', ok: true, index: message.index })
              try {
                const response = await sendToHoster(message, log2hoster)
                return resolve({ index: response.index })
              } catch (err) {
                // attestor.log('@TODO: hoster response timed out, how to deal with these errors?')
                return reject(err)
              }
            } else if (err) {
              log2encoder({ type: 'attestor', body: ['encoded checking error'] })
              encoderComm.serialize$.end({ type: 'encoded:error', error: 'INVALID_COMPRESSION', ...{ messageIndex: message.index } })
              return reject(err)
            }
          })
        })
      }
      async function sendToHoster (message, log2hoster) {
        const { type, feed, index, encoded, proof, nodes, signature } = message
        if (type !== 'encoded') return log({ type: 'attestor', body: [`Type not encoded, not sending to the hoster`] })

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
      const { storageChallenge, attestorKey, hosterKey, feedKey } = data
      const id = storageChallenge.id
      attestor.log({ type: 'attestor', body: [`Starting verifyStorageChallenge}`] })

      const opts3 = {
        plex: this.communication,
        senderKey: hosterKey,
        feedKey,
        receiverKey: attestorKey,
        id,
        myKey: attestorKey,
      }
      const log2hosterChallenge = attestor.log.sub(`<-HosterChallenge ${hosterKey.toString('hex').substring(0,5)}`)
      var id_streams = setTimeout(() => { log2hosterChallenge({ type: 'attestor', body: [`peerConnect timeout, ${JSON.stringify(opts3)}`] }) }, 500)
      const streams = await peerConnect(opts3, log2hosterChallenge)
      clearTimeout(id_streams)

      const all = []
      for await (const message of streams.parse$) {
        const { type } = message
        if (type === 'StorageChallenge') {
          const { storageChallengeID, data, index } = message
          log2hosterChallenge({ type: 'attestor', body: [`Storage Proof received, ${message.index}`]})
          // console.log(`Attestor received ${storageChallenge.chunks[index]}`)
          if (id === storageChallengeID) {
            if (proofIsVerified(message, feedKey, storageChallenge)) {
              streams.serialize$.write({
                type: 'StorageChallenge:verified',
                ok: true
              })
              log2hosterChallenge({ type: 'attestor', body: [`Storage verified for chunk ${storageChallenge.chunks[index]}`]})
              all.push(data)
              if (all.length === storageChallenge.chunks.length) resolve(all)
            }
          }
        } else {
          log2hosterChallenge({ type: 'attestor', body: [`UNKNOWN_MESSAGE messageType: ${type}`] })
          sendError('UNKNOWN_MESSAGE', { messageType: type })
          reject()
        }
      }

      async function proofIsVerified (message,feedKey, storageChallenge) {
        const { data, index } = message
        if (!data) console.log('No data')
        // console.log('verifying index', storageChallenge.chunks[index])
        // const feed = attestor.Hypercore(feedKey, { persist: false })
        // await feed.ready()
        // ...
        // await feed.close()
        // console.log('PROOF', data.proof)
        const encoded = Buffer.from(data.encoded)
        const decoded = await EncoderDecoder.decode(encoded)
        // proof.encoded
        // @TODO: merkle verify each chunk (to see if it belongs to the feed) && verify the signature
        // check the proof
        // hash the data
        return true
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

  // HELPERS

  getStatus(results) {
    var status = true
    for (var i = 0, len = results.length; i < len; i++) {
      status = status && (results[i].status === 'fulfilled')
    }
    return status
  }



}
