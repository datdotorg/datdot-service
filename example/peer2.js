const debug = require('debug')
const getChatAPI = require('./chatapi')
const { seedKeygen } = require('noise-peer')
const SDK = require('dat-sdk')
const p2plex = require('p2plex')
const sodium = require('sodium-universal')
const pump = require('pump')
const ndjson = require('ndjson')
const { PassThrough } = require('stream')

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
    const conc = Buffer.concat([myKeyBuff, peerBuf])
    const topic = Buffer.alloc(32)
    sodium.crypto_generichash(topic, conc)
    const ANNOUNCE = { announce: true, lookup: false }
    const peer = await plex.findByTopicAndPublicKey(topic, peerBuf, { announce: false, lookup: true })
    log('Peer found')

    // make streams
    const serialize$ = ndjson.serialize()
    const duplex$ = peer.receiveStream(topic)
    const obj$ = new PassThrough({ objectMode: true }) // makes it async iterable in "for await" loops

    pump(serialize$, duplex$, obj$, async (err) => {
      log('Streams closed and destroyed')
    })

    // listen and respond
    for await (const message of obj$) {
      const { type } = message
      log('Message received')
      serialize$.write({ type: 'received', ok: true })
    }
  }

  }
}

peer('peer2')

// HELPERS

async function getNoiseKey () {
  const sdk = await SDK({ aplication: 'example' })
  const NAMESPACE = 'peer2'
  const NOISE_NAME = 'noise'
  const noiseSeed = await sdk.deriveSecret(NAMESPACE, NOISE_NAME)
  const noiseKeyPair = seedKeygen(noiseSeed)
  return {noiseKeyPair, publicKey: noiseKeyPair.publicKey}
}
