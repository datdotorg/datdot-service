const sodium = require('sodium-universal')
const pump = require('pump')
const ndjson = require('ndjson')
const { PassThrough } = require('stream')

const p2plex = require('p2plex') // TODO: see what version 1.4.0 and higher don't work (see PR)
const ANNOUNCE = { announce: true, lookup: false }
const LOOKUP = { announce: false, lookup: true }

function deriveTopicKey (arr) {
  const [id, keySender, feedKey, keyReceiver] = arr
  // console.log({arr})
  // console.log(keySender.toString('hex'))
  // console.log(keyReceiver.toString('hex'))
  const idBuf = Buffer.from(id + 'deriving a topic', 'hex') // id to string is too short to make a unique buffer
  // console.log('idBuf', idBuf.toString('hex'))
  // console.log('ID', id)
  // console.log('ID BUF', idBuf.toString('hex'))
  const conc = Buffer.concat([idBuf, keySender, feedKey, keyReceiver])
  const topic = Buffer.alloc(32)
  sodium.crypto_generichash(topic, conc)
  // console.log('CONC', conc.toString('hex'))
  return topic
}

module.exports = peerConnect
peerConnect.deriveTopicKey = deriveTopicKey

async function peerConnect ({ plex, feedKey, senderKey, receiverKey, myKey, id }, log) {
  const [peerKey, SWARM_OPTS] = myKey === senderKey ? [receiverKey, LOOKUP] : [senderKey, ANNOUNCE]

  // Derive a shared swarm topic key to connect sender to the receiver (to receive encoded data)
  const topic = deriveTopicKey([id, senderKey, feedKey, receiverKey])

  // find by topic and key
  for (var peer; !peer;) {
    try {
      peer = await plex.findByTopicAndPublicKey(topic, peerKey, SWARM_OPTS)
      log({ type: 'p2plex', data: [`Got a peer`] })
    } catch (error) {
      log({ type: 'p2plex', data: [`timeout "findByTopicAndPublicKey" ${error} `] })
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
    log({ type: 'p2plex', data: [`Streams successfully closed and destroyed`] })
    peer.disconnect()
  })

  // listen
  peer.on('disconnected', function () {
    log({ type: 'p2plex', data: [`Peer disconnected, PeerKey: ${peerKey.toString('hex').substring(0,5)}, MyKey: ${myKey.toString('hex').substring(0,5)}`] })
  })
  peer.on('error', (err) => { 'p2plex error', err })

  serialize$.on('error', e => { e.type = 'serialize$' })
  duplex$.on('error', e => { e.type = 'duplex$' })
  parse$.on('error', e => { e.type = 'parse$' })
  obj$.on('error', e => { e.type = 'obj$' })

  serialize$.on('close', e => { log({ type: 'p2plex', data: [`serialize$ close`] }) })
  duplex$.on('close', e => { log({ type: 'p2plex', data: [`duplex$ close`] }) })
  parse$.on('close', e => { log({ type: 'p2plex', data: [`parse$ close`] }) })
  obj$.on('close', e => { log({ type: 'p2plex', data: [`obj$ close`] }) })

  async function end () {
    log({ type: 'p2plex', data: [`peer-connect end`] })
    const lastStream = (myKey === receiverKey) ? obj$ : parse$
    await lastStream.end()
    // can't do plex.destroy() because we need to flush the data
  }

  const streams = { serialize$, duplex$, parse$: (myKey === receiverKey) ? obj$ : parse$, end, peerKey }
  return streams
}
