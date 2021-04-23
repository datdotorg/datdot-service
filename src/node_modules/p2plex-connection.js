const sodium = require('sodium-universal')
const pump = require('pump')
const ndjson = require('ndjson')
const { PassThrough } = require('stream')

const p2plex = require('p2plex') // TODO: see what version 1.4.0 and higher don't work (see PR)
const ANNOUNCE = { announce: true, lookup: false }
const LOOKUP = { announce: false, lookup: true }
const Hyperbeam = require('hyperbeam')

function deriveTopicKey (arr) {
  const [id, senderKey, feedKey, receiverKey] = arr
  const idBuf = Buffer.from(id + 'deriving a topic', 'hex') // id to string is too short to make a unique buffer
  const conc = Buffer.concat([idBuf, senderKey, feedKey, receiverKey])
  const topic = Buffer.alloc(32)
  sodium.crypto_generichash(topic, conc)
  return topic
}

module.exports = peerConnect
peerConnect.deriveTopicKey = deriveTopicKey

async function peerConnect ({ plex, feedKey, senderKey, receiverKey, myKey, id }, log) {
  const [peerKey, SWARM_OPTS] = myKey === senderKey ? [receiverKey, LOOKUP] : [senderKey, ANNOUNCE]
  
  // Derive a shared swarm topic key to connect sender to the receiver (to receive encoded data)
  // const topic = deriveTopicKey([id, senderKey, feedKey, receiverKey])
  // const topic = id + senderKey.toString('hex') + feedKey.toString('hex') + receiverKey.toString('hex')
  const topic = senderKey.toString('hex') + feedKey.toString('hex') + receiverKey.toString('hex')
  const stream = new Hyperbeam(topic)

  // console.log('TOPIC', topic.toString('hex'))
  // console.log('ME',  myKey.toString('hex'))
  // console.log('LOOKING FOR', peerKey.toString('hex'))
  // console.log('-------------------------')
  // find by topic and key
  // for (var peer; !peer;) {
  //   peer = await plex.findByTopicAndPublicKey(topic, peerKey, SWARM_OPTS)
  //   try {
  //     log({ type: 'p2plex', data: [`Got a peer`] })
  //   } catch (error) {
  //     log({ type: 'p2plex', data: [`timeout "findByTopicAndPublicKey" ${error} `] })
  //   }
  // }


//  // make streams
//   const serialize$ = ndjson.serialize()
//   const duplex$ = myKey === senderKey ? peer.createStream(topic) : peer.receiveStream(topic)
//   const parse$ = ndjson.parse()
//   const obj$ = new PassThrough({ objectMode: true }) // makes it async iterable in "for await" loops

//   // pump
//   pump(serialize$, duplex$, ...(myKey === receiverKey) ? [parse$, obj$] : [parse$], async (err) => {
//     // @NOTE no need to destroy each stream manually as pump already takes care of this
//     log({ type: 'p2plex', data: [`Streams successfully closed and destroyed`] })
//     peer.disconnect()
//   })

//   // listen
//   peer.on('disconnected', function () {
//     log({ type: 'p2plex', data: [`Peer disconnected, PeerKey: ${peerKey.toString('hex').substring(0,5)}, MyKey: ${myKey.toString('hex').substring(0,5)}`] })
//   })
//   peer.on('error', (err) => { 'p2plex error', err })

//   serialize$.on('error', e => { e.type = 'serialize$' })
//   duplex$.on('error', e => { e.type = 'duplex$' })
//   parse$.on('error', e => { e.type = 'parse$' })
//   obj$.on('error', e => { e.type = 'obj$' })

//   serialize$.on('close', e => { log({ type: 'p2plex', data: [`serialize$ close`] }) })
//   duplex$.on('close', e => { log({ type: 'p2plex', data: [`duplex$ close`] }) })
//   parse$.on('close', e => { log({ type: 'p2plex', data: [`parse$ close`] }) })
//   obj$.on('close', e => { log({ type: 'p2plex', data: [`obj$ close`] }) })

//   async function end () {
//     log({ type: 'p2plex', data: [`peer-connect end`] })
//     const lastStream = (myKey === receiverKey) ? obj$ : parse$
//     await lastStream.end()
//     // can't do plex.destroy() because we need to flush the data
//   }

//   const streams = { serialize$, duplex$, parse$: (myKey === receiverKey) ? obj$ : parse$, end, peerKey }
  return stream
}
