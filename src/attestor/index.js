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
const DEFAULT_TIMEOUT = 7500

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
      
      const comparedAndHosted = []
      const expectedChunkCount = getRangesCount(ranges)
      let encodedCount = 0
      let ackCount = 0
      var timeout
      // if it timeouts, we push failed encoders to failed array
      var timeoutID = setTimeout(encoderFailed, DEFAULT_TIMEOUT)
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
        const allVerifiedAndForwarded = []
        for (var i = 0; i < expectedChunkCount; i++) {
          allVerifiedAndForwarded.push(handle_encoded(clone1.get(i)))
        }
        prepare_report(allVerifiedAndForwarded)
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
      coreStream.on('ack', ack => {
        log2hoster({ type: 'attestor', data: [`ACK from hoster: chunk received`]})
        ackCount++
      })

      // send the feedkey
      const temp_topic2 = topic_hoster + 'temp'
      const beam_temp2 = new Hyperbeam(temp_topic2)
      beam_temp2.write(JSON.stringify({ type: 'feedkey', feedkey: core.key.toString('hex')}))


      /////////////////////////////////////////////////////////////////////////////////////////////////////

      async function handle_encoded (data_promise) {
        return new Promise (async (resolve, reject) => {
          const data = await data_promise
          const message = JSON.parse(data.toString('utf-8'))
          const { type } = message
          if (timeout) return
          if (failed) return
          
          if (type === 'encoded') {
            encodedCount++
            // if (ackCount === expectedChunkCount) resolve()
            log2encoder({ type: 'attestor', data: [`${message.index} RECV_MSG from ${encoderKey.toString('hex')}`] })
            if (!merkleVerifyChunk(message)) {
              log2encoder({ type: 'attestor', data: [`Encoder failed ${encoderKey.toString('hex')} for message ${message.index}`] })
              failed = true
              // beam1.destroy({ type: 'encoded:error', error: 'INVALID_CHUNK', messageType: type })
              return resolve(encoderKey)
            }
            await compareAndForwardPromise(message).catch(err => {
              log2encoder(({ type: 'error', data: [`compareAndForwardPromise ERROR: ${err}`] }))
              if (err.encoderKey) {
                failed = true
                // beam1.destroy({ type: 'encoded:error', error: 'INVALID_COMPRESSION', messageType: type })
                resolve(err.encoderKey)
              }
              else if (err.hosterKey) resolve(err.hosterKey)
              // else resolve(err)
            })
            resolve()
          } else {
            log2encoder({ type: 'attestor', data: [`encoded checking UNKNOWN_MESSAGE MESSAGE TYPE ${type} `] })
            // beam1.destroy({ type: 'encoded:error', error: 'UNKNOWN_MESSAGE', messageType: type })
            failed = true
            resolve(err.encoderKey)
          }
          function merkleVerifyChunk (message) {
            // TODO merkle verify chunk and re-use also in compareStorage
            return true
          }
        })
      }

      function compareAndForwardPromise (message) {
        return new Promise((resolve, reject) => {
          var timeoutOtherEncoder
          var timeoutHoster
          var tid = setTimeout(() => {
            timeoutOtherEncoder = true
            log2encoder({ type: 'attestor', data: [`Timeout encoder`] })
          }, DEFAULT_TIMEOUT)
          compareCB(message, encoderKey, async (err, res) => {
            log2encoder({ type: 'attestor', data: [`${res} (index ${message.index}, encoder ${encoderKey.toString('hex')})`] })
            if (timeoutOtherEncoder) reject('timeoutOtherEncoder')
            if (err) {
              log2encoder({ type: 'attestor', data: [`Error from compare CB: ${err}`] })
              reject(err)
            } else if (!err) {
              try {
                const response = await sendToHoster(message, log2hoster)
                log2hoster({ type: 'attestor', data: [`Got response (kind of)`] })
                resolve()
              } catch (err) {
                log2hoster({ type: 'attestor', data: [`Timeout hoster`] })
                if (timeoutHoster) return
                timeoutHoster = true
                reject(hosterKey)
              }
            }
          })
        })
      }
 
      async function sendToHoster (message, log2hoster) {
        return new Promise(async (resolve, reject) => {
          message.type = 'verified'
          await core.append(JSON.stringify(message))
          log2hoster({ type: 'attestor', data: [`MSG appended ${message.index}`]})
          // if (ackCount === encodedCount) resolve()
          // resolve({ type: 'attestor', message: [`Message stored: ${message.index}`]})
          setTimeout(() => {resolve({ type: 'attestor', message: [`Message stored: ${message.index}`]})}, 2000)
        })
      }

      async function prepare_report (allVerifiedAndForwarded) {
        if (allVerifiedAndForwarded.length !== expectedChunkCount) return console.log('Something went wrong')
        const results = await Promise.all(allVerifiedAndForwarded).catch(e => {
          console.log('ERROR', e)
          log2hoster({ type: 'error', data: [`ERROR while preparing report ${e}`]})
        })
        console.log({results})
        console.log('All encoded received and sent to the hoster')
        console.log({ackCount})
        resolve(results)
        // beam1.destroy()
        // beam2.destroy()
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
