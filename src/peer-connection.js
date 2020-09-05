const sodium = require('sodium-universal')
const pump = require('pump')
const ndjson = require('ndjson')
const { PassThrough } = require('stream')

const ANNOUNCE = { announce: true, lookup: false }
const LOOKUP = { announce: false, lookup: true }
var counter = 0

function deriveTopicKey (arr) {
  const [id, keySender, feedKey, keyReceiver] = arr
  const idBuf = Buffer.from(id.toString(), 'hex')
  const conc = Buffer.concat([idBuf, keySender, feedKey, keyReceiver])
  const topic = Buffer.alloc(32)
  sodium.crypto_generichash(topic, conc)
  return topic
}

module.exports = peerConnect
peerConnect.deriveTopicKey = deriveTopicKey

async function peerConnect ({ comm, feedKey, senderKey, receiverKey, myKey, id }, log) {
  log = log.extend(`=${counter++}`)
  // Derive a shared swarm topic key to connect sender to the receiver (to receive encoded data)
  const topic = deriveTopicKey([id, senderKey, feedKey, receiverKey])
  // p2plex connect me to peer
  const [peerKey, SWARM_OPTS] = myKey === senderKey ? [receiverKey, LOOKUP] : [senderKey, ANNOUNCE]
  const peer = await comm.findByTopicAndPublicKey(topic, peerKey, SWARM_OPTS)
  const serialize$ = ndjson.serialize()
  const duplex$ = myKey === senderKey ? peer.createStream(topic) : peer.receiveStream(topic)
  const parse$ = ndjson.parse()
  const obj$ = new PassThrough({ objectMode: true }) // makes it async iterable in "for await" loops
  // log('connecting', {
  //   SWARM_OPTS,
  //   topic: topic.toString('hex'),
  //   peerKey: peerKey.toString('hex'),
  //   myKey: myKey.toString('hex'),
  // })
  pump(serialize$, duplex$, ...(myKey === receiverKey) ? [parse$, obj$] : [parse$], (err) => {
    log('Streams closed and destroyed')
    // log('All streams in the pump closed and destroyed', err)
    // @NOTE no need to destroy streams as pump already takes care of this

    // serialize$.destroy()
    // duplex$.destroy()
    // if (myKey === receiverKey) obj$.destroy()
    // parse$.destroy()

    // if (myKey === receiverKey) obj$.destroy() // when LAST is closed pump will destroy source
    // else parse$.destroy() // when LAST is closed pump will destroy source
    // log('destroy comm')
    // comm.destroy()
  })

  serialize$.on('error', e => { e.type = 'serialize$' })
  duplex$.on('error', e => { e.type = 'duplex$' })
  parse$.on('error', e => { e.type = 'parse$' })
  obj$.on('error', e => { e.type = 'obj$' })

  // serialize$.on('close', e => { log('serialize$ close') })
  // duplex$.on('close', e => { log('duplex$ close') })
  // parse$.on('close', e => { log('parse$ close') })
  // obj$.on('close', e => { log('obj$ close') })

  // if attestor (receiver)

  // serialize$.setMaxListeners(100)
  // duplex$.setMaxListeners(100)
  // parse$.setMaxListeners(100)

  async function end () {
    // serialize$.end()
    // duplex$.end()
    // if (myKey === receiverKey) obj$.end()
    // parse$.end()
    const lastStream = (myKey === receiverKey) ? obj$ : parse$
    lastStream.end()
  }
  const streams = { serialize$, duplex$, parse$: (myKey === receiverKey) ? obj$ : parse$, end, peerKey }
  return streams
}
