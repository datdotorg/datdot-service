const sodium = require('sodium-universal')
const pump = require('pump')
const ndjson = require('ndjson')
const { PassThrough } = require('stream')

const p2plex = require('p2plex')
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

async function peerConnect ({ plex, feedKey, senderKey, receiverKey, myKey, id }, log) {
  // p2plex connect me to peer
  const [peerKey, SWARM_OPTS] = myKey === senderKey ? [receiverKey, LOOKUP] : [senderKey, ANNOUNCE]
  log = log.extend(`=${counter++}`)

  // Derive a shared swarm topic key to connect sender to the receiver (to receive encoded data)
  const topic = deriveTopicKey([id, senderKey, feedKey, receiverKey])

  // find by topic and key
  for (var peer; !peer;) {
    try {
      peer = await plex.findByTopicAndPublicKey(topic, peerKey, SWARM_OPTS)
    } catch (error) {
      log('timeout `findByTopicAndPublicKey`', error)
    }
  }

 // make streams
  const serialize$ = ndjson.serialize()
  const duplex$ = myKey === senderKey ? peer.createStream(topic) : peer.receiveStream(topic)
  const parse$ = ndjson.parse()
  const obj$ = new PassThrough({ objectMode: true }) // makes it async iterable in "for await" loops

  // pump
  pump(serialize$, duplex$, ...(myKey === receiverKey) ? [parse$, obj$] : [parse$], async (err) => {
    // @NOTE no need to destroy each stream manually as pump already takes care of this
    // log('Streams closed and destroyed', err)
    log('Streams closed and destroyed')
    // log('_____________my key', myKey.toString('hex'))
    const peers = [...plex.peers]
    for (var i = 0;  i < peers.length; i++) {
      log(`=== DISCONNECTING: pubkey: ${peers[i].publicKey.toString('hex')}, peer.incoming:  ${peers[i].incoming}`)
      // if (!peers[i].incoming) await peers[i].disconnect()
      // if (!peers[i].publicKey === peerKey) peers[i].disconnect()
      peers[i].disconnect()
    }
  })

  // listen
  peer.on('disconnected', () => { log('Peer disconnected')})
  serialize$.on('error', e => { e.type = 'serialize$' })
  duplex$.on('error', e => { e.type = 'duplex$' })
  parse$.on('error', e => { e.type = 'parse$' })
  obj$.on('error', e => { e.type = 'obj$' })

  // serialize$.on('close', e => { log('serialize$ close') })
  // duplex$.on('close', e => { log('duplex$ close') })
  // parse$.on('close', e => { log('parse$ close') })
  // obj$.on('close', e => { log('obj$ close') })

  async function end () {
    log('--------------------------peer-connect end')
    const lastStream = (myKey === receiverKey) ? obj$ : parse$
    await lastStream.end()
    // can't do plex.destroy() because we need to flush the data
  }

  const streams = { serialize$, duplex$, parse$: (myKey === receiverKey) ? obj$ : parse$, end, peerKey }
  log('New plex created')
  return streams
}
