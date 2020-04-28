const SDK = require('dat-sdk')
const RAM = require('random-access-memory')
const levelup = require('levelup')
const memdown = require('memdown')
const p2plex = require('p2plex')
const { once } = require('events')
const ndjson = require('ndjson')
const pump = require('pump')

const EncoderDecoder = require('../EncoderDecoder')
const { ENCODING_RESULTS_STREAM } = require('../constants')

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
      db,
      onNeedsEncoding
    })

    console.log('Initializing feed')
    var sdk2 = await SDK({
      storage: RAM
    })
    var communication2 = p2plex()

    // - Initialize a feed
    var feed = sdk2.Hypercore('Example Feed')

    await feed.append('Hello World')

    console.log('Adding feed to hoster')
    await hoster.addFeed(feed.key)

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

  async function onNeedsEncoding (key, index) {
    // Notify encoder to encode data and send it to us
    console.log('Encoding data for', key, index)

    const data = await feed.get(index)

    const encoded = EncoderDecoder.encode(data)

    const proof = Buffer.from('Pranked')

    console.log('Connecting to peer')

    const peer = await communication2.findByPublicKey(hoster.publicKey)
    const resultStream = ndjson.serialize()
    const confirmStream = ndjson.parse()
    const encodingStream = peer.createStream(ENCODING_RESULTS_STREAM)

    pump(resultStream, encodingStream, confirmStream)

    confirmStream.resume()

    console.log('Storing data for', key, index)

    resultStream.write({
      type: 'encoded',
      feed: key,
      index,
      encoded,
      proof
    })

    console.log('Waiting for result')

    const message = await once(confirmStream, 'data')

    if (message.error) throw new Error(message.error)

    console.log('Storage result:', message)

    console.log('Disconnecting from peer')
    await peer.disconnect()
  }
}
