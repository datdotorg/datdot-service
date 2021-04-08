const delay = require('delay')
const p2plex = require('p2plex')
const { seedKeygen } = require('noise-peer')
const { performance } = require('perf_hooks')
const hypercore = require('hypercore')
const RAM = require('random-access-memory')
const { toPromises } = require('hypercore-promisifier')
const Hyperbeam = require('hyperbeam')
const derive_topic = require('../derive_topic')

const peerConnect = require('../p2plex-connection')
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

  async verifyAndForwardFor (opts) {
    const attestor = this

    return new Promise(async (resolve, reject) => {
      const { amendmentID, attestorKey, encoderKey, hosterKey, ranges, feedKey, compareCB } = opts
      const log2encoder = attestor.log.sub(`<-Encoder ${encoderKey.toString('hex').substring(0,5)}`)
      const log2hoster = attestor.log.sub(`->Hoster ${hosterKey.toString('hex').substring(0,5)}`)
      
      const encodedReceived = []
      const comparedAndHosted = []
      const expectedChunkCount = getRangesCount(ranges)
      var encodedCount = 0
      var timeout
      // if it timeouts, we push failed encoders to failed array
      var timeoutID = setTimeout(encoderFailed, 5000)
      var failed
      
      /* ------------------------------------------- 
                  a. CONNECT TO ENCODER
      -------------------------------------------- */
      const topic_encoder = derive_topic({ senderKey: encoderKey, feedKey, receiverKey: attestorKey, id: amendmentID })
      const beam1 = new Hyperbeam(topic_encoder)

      // get the key and replicate encoder hypercore
      const temp_topic1 = topic_encoder +'temp'
      const beam_temp1 = new Hyperbeam(temp_topic1)
      beam_temp1.once('data', async (data) => {
        const message = JSON.parse(data.toString('utf-8'))
        if (message.type === 'feedkey') replicate(Buffer.from(message.feedkey, 'hex'))
        clearTimeout(timeoutID)
      })
      
      async function replicate (feedkey) {
        const clone1 = toPromises(new hypercore(RAM, feedkey, {
          valueEncoding: 'utf-8',
          sparse: true
        }))
  
        // pipe streams
        const clone1Stream = clone1.replicate(false, { live: true })
        clone1Stream.pipe(beam1).pipe(clone1Stream)

        // // get replicated data
        for (var i = 0; i < expectedChunkCount; i++) {
          const data = await clone1.get(i)
          handle_encoded(data)
          beam_temp1.destroy()
        }
        prepare_report()
      }

      /* ------------------------------------------- 
                  b. CONNECT TO HOSTER
      -------------------------------------------- */
      const topic_hoster = derive_topic({ senderKey: attestorKey, feedKey, receiverKey: hosterKey, id: amendmentID })
      const beam2 = new Hyperbeam(topic_hoster)

      // create a hypercore
      const core = toPromises(new hypercore(RAM, { valueEncoding: 'utf-8' }))
      await core.ready()

      // pipe streams
      const coreStream = core.replicate(true, { live: true, ack: true })
      coreStream.pipe(beam2).pipe(coreStream)

      // send the feedkey
      const temp_topic2 = topic_hoster + 'temp'
      const beam_temp2 = new Hyperbeam(temp_topic2)
      beam_temp2.write(JSON.stringify({ type: 'feedkey', feedkey: core.key.toString('hex')}))


      /////////////////////////////////////////////////////////////////////////////////////////////////////

      async function handle_encoded (data) {
        const message = JSON.parse(data.toString('utf-8'))
        const { type } = message
        if (timeout) return
        if (failed) return
        
        if (type === 'encoded') {
          if (encodedReceived.length === expectedChunkCount) return
          encodedCount++
          log2encoder({ type: 'attestor', data: [`${message.index} RECV_MSG count (${encodedCount}) from ${encoderKey.toString('hex')}`] })
          if (!merkleVerifyChunk(message)) {
            log2encoder({ type: 'attestor', data: [`Encoder failed ${encoderKey.toString('hex')} for message ${message.index}`] })
            failed = true
            beam1.destroy({ type: 'encoded:error', error: 'INVALID_CHUNK', messageType: type })
            // return resolve('Encoder failed', encoderKey)
          }
          encodedReceived.push({ message })
          comparedAndHosted.push(compareAndForwardPromise(message).catch(err => {
            console.log('compareAndForwardPromise ERROR', err)
            log2encoder(({ type: 'error', data: [`compareAndForwardPromise ERROR: ${err}`] }))
            if (err.encoderKey) {
              failed = true
              beam1.destroy({ type: 'encoded:error', error: 'INVALID_COMPRESSION', messageType: type })
              resolve(err.encoderKey)
            }
            else if (err.hosterKey) resolve(err.hosterKey)
            else resolve(err)
          }))
        } else {
          log2encoder({ type: 'attestor', data: [`encoded checking UNKNOWN_MESSAGE MESSAGE TYPE ${type} `] })
          beam1.end({ type: 'encoded:error', error: 'UNKNOWN_MESSAGE', messageType: type })
          failed = true
          // resolve(encoderKey)
        }
        function merkleVerifyChunk (message) {
          // TODO merkle verify chunk and re-use also in compareStorage
          return true
        }
      }

      function compareAndForwardPromise (message) {
        return new Promise((resolve, reject) => {
          var timeoutOtherEncoder
          var timeoutHoster
          var tid = setTimeout(() => { // something went wrong with another encoder
            timeoutOtherEncoder = true
            beam1.destroy() // @NOTE: new amendment is coming, encoder should keep all their data
            log2encoder({ type: 'attestor', data: [`Timeout encoder`] })
            resolve('timeout encoder')
          }, 15000)
          compareCB(message, encoderKey, async (err, res) => {
            log2encoder({ type: 'attestor', data: [`${res} (index ${message.index}, encoder ${encoderKey.toString('hex')})`] })
            if (timeoutOtherEncoder) return resolve('timeoutOtherEncoder')
            if (err) {
              log2encoder({ type: 'attestor', data: [`Error from compare CB: ${err}`] })
              return reject(err)
            } else if (!err) {
              try {
                const response = await sendToHoster(message, log2hoster)
                log2hoster({ type: 'attestor', data: [`Got reponse`] })
                return resolve(`Hoster stored index ${message.index}`)
              } catch (err) {
                log2hoster({ type: 'attestor', data: [`Timeout hoster`] })
                if (timeoutHoster) return
                timeoutHoster = true
                return resolve('hoster timeout', hosterKey)
              }
            }
          })
        })
      }
 
      async function sendToHoster (message, log2hoster) {
        return new Promise(async (resolve, reject) => {
          console.log('sending to hoster')
          message.type = 'verified'
          await core.append(JSON.stringify(message))
          log2hoster({ type: 'attestor', data: [`MSG appended ${message.index}`]})
          // TODO: don't just asume, get some ack back before resolving)
          setTimeout(() => { resolve({ type: 'attestor', message: [`Message stored: ${message.index}`]}) }, 2000)
        })
      }

      async function prepare_report () {
        if (encodedReceived.length !== expectedChunkCount) return resolve(encoderKey)
        const results = await Promise.allSettled(comparedAndHosted)
        console.log({results})
        if (results.length === expectedChunkCount) {
          console.log('All encoded received and sent to the hoster')
          beam1.destroy()
          beam2.destroy()
          resolve('All encoded received and sent to the hoster')
        }
      }

      function encoderFailed () {
        console.log(`Timeout: encoder failed, amendment: ${amendmentID}`)
        beam1.end({ type: 'encoded:error', error: 'TIMEOUT' })
        timeout = true
        resolve('Encoder failed', encoderKey)
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
              streams.write({
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
        // TODO merkleVerifyChunk does smae thing
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
        // TODO: merkle verify each chunk (to see if it belongs to the feed) && verify the signature
        // check the proof
        // hash the data
        return true
      }

      function sendError (message, details = {}) {
        streams.end({
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

  /* ----------------------------------------------------------------------
                                  HELPERS
  ---------------------------------------------------------------------- */

  allFulfilled(results) {
    var fulfilled = true
    for (var i = 0, len = results.length; i < len; i++) {
      fulfilled = fulfilled && (results[i].status === 'fulfilled')
    }
    return fulfilled
  }

}
