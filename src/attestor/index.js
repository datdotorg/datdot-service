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
    const { amendmentID, attestorKey, encoderKey, hosterKey, feedKey, ranges, compareCB } = opts
    const topic_encoder = derive_topic({ senderKey: encoderKey, feedKey, receiverKey: attestorKey, id: amendmentID })
    const topic_hoster = derive_topic({ senderKey: attestorKey, feedKey, receiverKey: hosterKey, id: amendmentID })
    const expectedChunkCount = getRangesCount(ranges)
    const report = []
    let STATUS
    let hoster_failed
    let encoder_failed
    let encoder_channel
    let hoster_channel
    var pending = 0
    try {
      encoder_channel = await connect_to('encoder', true, topic_encoder, expectedChunkCount)
      hoster_channel = await connect_to('hoster', false, topic_hoster, expectedChunkCount)
      await encoder_channel('HEAR', handler)
    } catch (err) {
      if (err.type === 'encoder_connection_fail') {
        if (hoster_channel) hoster_channel('QUIT')
        report.push(encoderKey)
      }
      else if (err.type === 'hoster_connection_fail') {
        report.push(hosterKey)
        hoster_failed = true
        try {
          await encoder_channel('HEAR', handler)
        } catch (err) {
          if (err.type === 'encoder_connection_fail') report.push(encoderKey)
          else console.log(err)
        }
      }
      else if (err.type === 'encoder_timeout') report.push(encoderKey)
      else console.log(err)
    }
    return report

    async function handler (type, chunk) {      
      try {
        if (type === 'FAIL') {
          STATUS = 'FAILED'
          return hoster_channel('QUIT')
        }
        if (type === 'DONE') {
          STATUS = 'DONE'
          if (!pending) hoster_channel('QUIT')
          return
        }
        if (type === 'DATA') pending++
        await compareCB(chunk, encoderKey) // TODO: REFACTOR to promise and throw invalid_encoding or other_encoder_failed
        if (STATUS === 'FAILED') {
          pending--
          if (!pending) hoster_channel('QUIT')
          return
        }
        await hoster_channel('SEND', chunk)
        pending--
        if (STATUS === 'DONE' || STATUS === 'FAILED') {
          if (!pending) hoster_channel('QUIT')
          return
        }
        return 'NEXT'
      } catch (err) {
        pending--
        if (STATUS === 'DONE') {
          if (!pending) hoster_channel('QUIT')
          return
        }
        else if (err.type === 'invalid_encoding' && !encoder_failed) {
          encoder_failed = true
          hoster_channel('QUIT')
          report.push(encoderKey)
          STATUS = 'FAIL'
          return 'QUIT'
        }
        else if (err.type === 'other_encoder_failed') {
          STATUS = 'FAIL'
          hoster_channel('QUIT')
          return 'MUTE' // keep receiving chunks, but stop listening
        }
        else if (err.type === 'hoster_timeout') {
          STATUS = 'FAIL'
          hoster_failed = true
          report.push(hosterKey)
          return 'MUTE'
        }
        else console.log(err)
      }
    }
    
    ///////////////////////////////////////////////////////////

    async function connect_to (role, isSender, topic, expectedChunkCount) {
      const chunks = {}
      var beam_error
      return new Promise(async (resolve, reject) => {
        const tid = setTimeout(() => {
          beam.destroy()
          reject({ type: `${role}_timeout` })
        }, DEFAULT_TIMEOUT)
        const beam = new Hyperbeam(topic)
        beam.on('error', err => { 
          clearTimeout(tid)
          beam.destroy()
          if (beam_once) {
            beam_once.destroy()
            reject({ type: `${role}_connection_fail`, data: err })
          } else beam_error = err
        })
        let core
        const once_topic = topic + 'once'
        var beam_once = new Hyperbeam(once_topic)
        beam_once.on('error', err => { 
          clearTimeout(tid)
          beam_once.destroy()
          beam.destroy()
          reject({ type: `${role}_connection_fail`, data: err })
        })
        if (isSender) {
          beam_once.once('data', async (data) => {
            const message = JSON.parse(data.toString('utf-8'))
            if (message.type === 'feedkey') {
              const feedKey = Buffer.from(message.feedkey, 'hex')
              const clone = toPromises(new hypercore(RAM, feedKey, { valueEncoding: 'utf-8', sparse: true }))
              core = clone
              const cloneStream = clone.replicate(false, { live: true })
              cloneStream.pipe(beam).pipe(cloneStream)
              beam_once.destroy()
              beam_once = undefined
              resolve(channel)
            }
          })
        } else {
          core = toPromises(new hypercore(RAM, { valueEncoding: 'utf-8' }))
          await core.ready()
          core.on('error', err => {
            Object.values(chunks).forEach(({ reject }) => reject(err))
          })
          const coreStream = core.replicate(true, { live: true, ack: true })
          coreStream.pipe(beam).pipe(coreStream)
          beam_once.write(JSON.stringify({ type: 'feedkey', feedkey: core.key.toString('hex')}))
          coreStream.on('ack', ack => {
            const index = ack.start
            const resolve = chunks[index].resolve
            delete chunks[index]
            resolve()
          })
          resolve(channel)
        }

        async function channel (type, data) {
          if (type === 'QUIT') {
            return new Promise((resolve, reject) => {
              clearTimeout(tid)
              beam.destroy()
              resolve()
            })
          }
          else if (type === 'SEND') {
            return new Promise(async (resolve, reject) => {
              const message = await data
              const parsed = JSON.parse(message.toString('utf-8'))
              parsed.type = 'verified'
              chunks[parsed.index] = { resolve, reject }
              await core.append(JSON.stringify(parsed))
            })
          }
          else if (type === 'HEAR') {
            var handlerCB = data
            var status
            var error
            return new Promise(async (resolve, reject) => {
              if (beam_error) return reject({ type: `${role}_connection_fail`, data: beam_error })
              core.on('error', err => {
                error = err
                clearTimeout(tid)
                beam.destroy()
                reject({ type: `${role}_connection_fail`, data: err })
              })
              // get replicated data
              const chunks = []
              for (var i = 0; i < expectedChunkCount; i++) {
                if (status === 'DONE') return
                const chunk = core.get(i)
                chunks.push(chunk)
                if (status === 'MUTED') continue
                const promise = handlerCB('DATA', chunk)
                promise.catch(err => {
                  status = 'FAIL'
                  clearTimeout(tid)
                  beam.destroy()
                  reject({ type: `${role}_connection_fail`, data: err })
                  handlerCB('FAIL', err)
                }).then(type => {
                  if (type === 'NEXT') return
                  if (type === 'MUTE') status = 'MUTED'
                  if (type === 'QUIT') {
                    status = 'DONE'
                    clearTimeout(tid)
                    beam.destroy()
                    handlerCB('DONE')
                    return resolve()
                  }
                })
              }
              await Promise.all(chunks)
              clearTimeout(tid)
              beam.destroy()
              resolve(report)
              handlerCB('DONE')
            })
          }
        }
      })
    }
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
          reject({ type: 'attestor', key: attestorKey })
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
