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
    this.communication.on('connection', (peer) => { this.log({ type: 'attestor', data: [`new connection`]}) })
    this.publicKey = noiseKeyPair.publicKey
  }

/* ----------------------------------------------------------------------
                            VERIFY ENCODING
---------------------------------------------------------------------- */

  async verifyAndForwardFor (opts, currentState, abortSignal) {
    const attestor = this

    abortSignal.onabort = event => {
      // @TODO: cancel ongoing operations
    }

    return new Promise(async (resolve, reject) => {
      const { amendmentID, attestorKey, encoderKey, hosterKey, ranges, feedKey, compareCB } = opts
      const opts1 = {
        plex: this.communication,
        senderKey: encoderKey,
        feedKey,
        receiverKey: attestorKey,
        id: amendmentID,
        myKey: attestorKey,
      }
      const log2encoder = attestor.log.sub(`<-Encoder ${encoderKey.toString('hex').substring(0,5)}`)

      // var id_streams1 = setTimeout(() => { log2encoder({ type: 'attestor', data: [`peerConnect timeout, ${JSON.stringify(opts2)}`] }) }, 500)
      const encoderComm = await peerConnect(opts1, log2encoder)
      // clearTimeout(id_streams1)

      const opts2 = {
        plex: this.communication,
        senderKey: attestorKey,
        feedKey,
        receiverKey: hosterKey,
        id: amendmentID,
        myKey: attestorKey,
      }
      const log2hoster = attestor.log.sub(`->Hoster ${hosterKey.toString('hex').substring(0,5)}`)

      // var id_streams2 = setTimeout(() => { log2hoster({ type: 'attestor', data: [`peerConnect timeout, ${JSON.stringify(opts2)}`] }) }, 500)
      const streams = await peerConnect(opts2, log2hoster)
      // clearTimeout(id_streams2)

      // check the encoded data and if ok, send them to the hosters
      log2encoder({ type: 'attestor', data: ['Start receiving data from the encoder'] })
      const encodedReceived = []
      const comparedAndHosted = []
      const expectedMessageCount = getRangesCount(ranges)
      var encodedCount = 0
      var timeout

      // if it timeouts, we push failed encoders to failed array
      var timeoutID = setTimeout(encoderFailed, 5000)
      function encoderFailed () {
        console.log(`Timeout: encoder failed, amendment: ${amendmentID} (${verified.length}/${expectedMessageCount})`)
        encoderComm.serialize$.end({ type: 'encoded:error', error: 'TIMEOUT' })
        timeout = true
        resolve(encoderKey)
      }
      var failed
      for await (const message of encoderComm.parse$) {
        if (timeout) return
        if (failed) return
        log2encoder({ type: 'attestor', data: [`${message.index} RECV_MSG ${encoderKey.toString('hex')}`] })
        encodedCount++
        const { type } = message
        if (type === 'encoded') {
          if (!merkleVerifyChunk(message)) {
            log2encoder({ type: 'attestor', data: [`Encoder failed ${encoderKey.toString('hex')} for message ${message.index}`] })
            failed = true
            encoderComm.serialize$.end({ type: 'encoded:error', error: 'INVALID_CHUNK', messageType: type })
            return resolve(encoderKey)
          }
          encodedReceived.push({ message })
          comparedAndHosted.push(compareAndForwardPromise(message).catch(err => {
            if (err.encoderKey) {
              failed = true
              encoderComm.serialize$.end({ type: 'encoded:error', error: 'INVALID_COMPRESSION', messageType: type })
              resolve(err.encoderKey)
            }
            else if (err.hosterKey) resolve(err.hosterKey)
            else resolve()
          }))
          if (encodedReceived.length === expectedMessageCount) break // @TODO: do we need to END the stream here?
        } else {
          log2encoder({ type: 'attestor', data: [`encoded checking UNKNOWN_MESSAGE MESSAGE TYPE ${type} `] })
          encoderComm.serialize$.end({ type: 'encoded:error', error: 'UNKNOWN_MESSAGE', messageType: type })
          failed = true
          resolve(encoderKey)
        }
      }

      function merkleVerifyChunk (message) {
        // @TODO merkle verify chunk and re-use also in compareStorage
        return true
      }

      clearTimeout(timeoutID)
      if (encodedReceived.length !== expectedMessageCount) return resolve(encoderKey)

      // prepare the report
      const results = await Promise.allSettled(comparedAndHosted)

// @TODO: CHANGE ALL THE THINGS BELOW

      // array<???> -> boolean
      const isFulfilled = this.allFulfilled(results)
      console.log({status})
      if (!isFulfilled) {
        console.log(`Hoster failed: amendment: ${amendmentID} (${encodedReceived.length}/${expectedMessageCount})`)
        log2encoder({ type: 'attestor', data: [`Hoster failed: amendment: ${amendmentID} (${encodedReceived.length}/${expectedMessageCount}))`] })
        streams.end()
        resolve(hosterKey) // encoderKey
        return
      }
      streams.end()
      resolve()
      return

      function compareAndForwardPromise (message) {
        return new Promise((resolve, reject) => {
          var timeoutOtherEncoder
          var timeoutHoster
          var tid = setTimeout(() => { // something went wrong with another encoder
            timeoutOtherEncoder = true
            encoderComm.serialize$.end({ type: 'encoded:timeout' }) // @NOTE: new amendment is coming, encoder should keep all their data
            resolve()
          }, 5000)
          compareCB(message, encoderKey, async (err, res) => {
            if (timeoutOtherEncoder) return resolve()
            if (!err) {
              log2encoder({ type: 'attestor', data: [`${message.index} SEND_ACK ${encoderKey.toString('hex')}`] })
              encoderComm.serialize$.write({ type: 'encoded:checked', ok: true, index: message.index })
              try {
                const response = await sendToHoster(message, log2hoster)
                return resolve()
              } catch (err) {
                if (timeoutHoster) return
                timeoutHoster = true
                return resolve(hosterKey)
              }
            } else if (err) {
              // @TODO:future: make retry strategy (e.g. try again while waiting for others and stuff like that)
              log2encoder({ type: 'attestor', data: ['encoded checking error'] })
              encoderComm.serialize$.end({ type: 'encoded:error', error: 'INVALID_COMPRESSION', ...{ messageIndex: message.index } })
              return reject(err)
            }
            // 1. successful compare => write CHECKED:TRUE to encoder
            // 2. failed compare => end CHECKED:INVALID to encoder + ignore all further compare callbacks, because we dont notify encoder about more failed or unavailable chunks
            // 3. timeout compare => end CHECKED:UNAVAILABLE + ignore all further compare callbacks, because we dont notify encoder about more failed or unavailable chunks
          })
        })
      }
      async function sendToHoster (message, log2hoster) {
        const { type, feed, index, encoded, proof, nodes, signature } = message
        if (type !== 'encoded') return log({ type: 'attestor', data: [`Type not encoded, not sending to the hoster`] })

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
      attestor.log({ type: 'attestor', data: [`Starting verifyStorageChallenge}`] })

      const opts3 = {
        plex: this.communication,
        senderKey: hosterKey,
        feedKey,
        receiverKey: attestorKey,
        id,
        myKey: attestorKey,
      }
      const log2hosterChallenge = attestor.log.sub(`<-HosterChallenge ${hosterKey.toString('hex').substring(0,5)}`)

      // var id_streams = setTimeout(() => { log2hosterChallenge({ type: 'attestor', data: [`peerConnect timeout, ${JSON.stringify(opts3)}`] }) }, 500)
      const streams = await peerConnect(opts3, log2hosterChallenge)
      // clearTimeout(id_streams)

      const all = []
      for await (const message of streams.parse$) {
        const { type } = message
        if (type === 'StorageChallenge') {
          const { storageChallengeID, data, index } = message
          log2hosterChallenge({ type: 'attestor', data: [`Storage Proof received, ${message.index}`]})
          // console.log(`Attestor received ${storageChallenge.chunks[index]}`)
          if (id === storageChallengeID) {
            if (proofIsVerified(message, feedKey, storageChallenge)) {
              streams.serialize$.write({
                type: 'StorageChallenge:verified',
                ok: true
              })
              log2hosterChallenge({ type: 'attestor', data: [`Storage verified for chunk ${storageChallenge.chunks[index]}`]})
              all.push(data)
              if (all.length === storageChallenge.chunks.length) resolve(all)
            }
          }
        } else {
          log2hosterChallenge({ type: 'attestor', data: [`UNKNOWN_MESSAGE messageType: ${type}`] })
          sendError('UNKNOWN_MESSAGE', { messageType: type })
          reject()
        }
      }

      async function proofIsVerified (message,feedKey, storageChallenge) {
        // @TODO merkleVerifyChunk does smae thing
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

  allFulfilled(results) {
    var fulfilled = true
    for (var i = 0, len = results.length; i < len; i++) {
      fulfilled = status && (results[i].status === 'fulfilled')
    }
    return fulfilled
  }



}
