const debug = require('debug')
const getChatAPI = require('./chatapi')
const { seedKeygen } = require('noise-peer')
const SDK = require('dat-sdk')
const p2plex = require('p2plex')
const sodium = require('sodium-universal')
const pump = require('pump')
const ndjson = require('ndjson')
const { PassThrough } = require('stream')
const Hypercore = require('hypercore')
const reallyReady = require('hypercore-really-ready')
const ram = require('random-access-memory')

/******************************************************************************
  PEER
******************************************************************************/
async function peer (name) {
  const [chaturi] = process.argv.slice(2)
  const log = debug(`${name}`)
  const TODO = log.sub('@TODO:')
  const profile = { name, log }
  const chatAPI = await getChatAPI(profile, chaturi)

  log(`startup`)

  chatAPI.on(message => {
    const { flow: [from], type, body } = message
    if (from === name)  return
    if (type == 'peerKey') return receive(from, body)
    log('unknown message type:', message)
    process.exit(1)
  })

  /************************************
    SEND NOISEKEY
  ************************************/
  async function send () {
    const { publicKey } = await getNoiseKey()
    chatAPI.send({ type: 'peerKey', body: publicKey })
  }
  send()
  /************************************
    HEAR PEERKEY
  ************************************/
  async function receive (from, peerKey) {
    log({ from, peerKey })

    connect()
    async function connect () {
      const { noiseKeyPair, publicKey: myKey } = await getNoiseKey()
      const plex = p2plex({ keyPair: noiseKeyPair })
      const peerBuf = Buffer.from(peerKey, 'hex')
      const myKeyBuff = Buffer.from(myKey, 'hex')
      const conc = Buffer.concat([peerBuf, myKeyBuff])
      const topic = Buffer.alloc(32)
      sodium.crypto_generichash(topic, conc)
      const peer = await plex.findByTopicAndPublicKey(topic, peerBuf, { announce: true, lookup: false })
      log('Peer found')

      // make streams
      const serialize$ = ndjson.serialize()
      const duplex$ = peer.createStream(topic)
      const parse$ = ndjson.parse()

      pump(serialize$, duplex$, parse$, async (err) => { log('Streams closed and destroyed') })

      // create message
      const feed = Hypercore(ram)

      await feed.ready()

      await feed.append('Hello World!')
      await feed.append('Pozdravljen svet!')
      await feed.append('你好，世界!')
      await feed.append('Hola Mundo!')
      await feed.append('สวัสดีชาวโลก!')
      await feed.append('Hallo Welt!')
      await feed.append('Bonjour le monde!')
      await feed.append('Здраво Свете!')
      await feed.append('Hai dunia!')

      await reallyReady(feed)

      // write and listen
      feed.flush(async () => {
        for (var i = 0; i < feed.length-1; i++) {
          feed.get(i, (err, message) => {
            all.push(sendData())
            return new Promise((resolve, reject) => {
              serialize$.write(message)
              var timeout
              const toID = setTimeout(() => {
                timeout = true
                parse$.off('data', ondata)
                const error = ['FAIL_ACK_TIMEOUT']
                log({ type: 'error', body: [`Error: ${error}`] })
                reject()
              }, 5000)

              parse$.on('data', ondata)

              async function ondata (response) {
                if (timeout) return log('Unexpected response')
                parse$.off('data', ondata)
                log(response)
                clearTimeout(toID)
                resolve()
              }
            })
          })
        }
      })
    }

  }
}

peer('peer1')

// HELPERS

async function getNoiseKey () {
  const sdk = await SDK({ aplication: 'example' })
  const NAMESPACE = 'peer1'
  const NOISE_NAME = 'noise'
  const noiseSeed = await sdk.deriveSecret(NAMESPACE, NOISE_NAME)
  const noiseKeyPair = seedKeygen(noiseSeed)
  return {noiseKeyPair, publicKey: noiseKeyPair.publicKey}
}
