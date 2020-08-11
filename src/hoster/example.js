const SDK = require('dat-sdk')
const RAM = require('random-access-memory')
const levelup = require('levelup')
const memdown = require('memdown')
const p2plex = require('p2plex')
const { once } = require('events')
const ndjson = require('ndjson')
const pump = require('pump')

const EncoderDecoder = require('../EncoderDecoder')

const Hoster = require('./')

run()

async function run () {
  try {
    // - Set up SDK and DB
    var sdk1 = await SDK({
      storage: RAM
    })
    var db = levelup(memdown())

    console.log('Initializing hoster')
    var hoster = await Hoster.load({
      sdk: sdk1,
      EncoderDecoder,
      db
    })

    console.log('Hoster ID', hoster.publicKey)

    console.log('Initializing feed')
    var sdk2 = await SDK({
      storage: RAM
    })
    var communication2 = p2plex()

    // - Initialize a feed
    var feed = sdk2.Hypercore('Example Feed')

    await feed.append('Hello World')

    console.log('Adding feed to hoster', feed.key)

    await Promise.all([
      hoster.addFeed(feed.key, communication2.publicKey),
      sendEncodings(feed.key, 0)
    ])

    console.log('Done!')
  } catch (e) {
    console.error(e.stack)
  } finally {
    console.log('Cleaning up')
    hoster.close()
    communication2.destroy()
    db.close()
    sdk1.close()
    sdk2.close()
  }

  async function sendEncodings (key, index) {
    // TODO: Derive topic
    const topic = key

    console.log('Connecting to peer')

    const peer = await communication2.findByTopicAndPublicKey(topic, hoster.publicKey, {
      announce: false,
      lookup: true
    })

    console.log('Connected to peer')

    // Notify encoder to encode data and send it to us
    console.log('Encoding data for', key, index)

    const data = await feed.get(index)

    const encoded = await EncoderDecoder.encode(data)

    const proof = Buffer.from('Pranked')

    const { nodes, signature } = await feed.proof(index)

    const resultStream = ndjson.serialize()
    const confirmStream = ndjson.parse()
    const encodingStream = peer.createStream(topic)

    pump(resultStream, encodingStream, confirmStream)

    console.log('Storing data for', key, index)

    resultStream.write({
      type: 'encoded',
      feed: key,
      index,
      encoded,
      proof,
      nodes,
      signature
    })

    confirmStream.resume()

    console.log('Waiting for result')

    const message = await once(confirmStream, 'data')

    if (message.error) throw new Error(message.error)

    console.log('Storage result:', message)

    resultStream.end()
  }
}
