const RAM = require('random-access-memory')
const SDK = require('dat-sdk')
const p2plex = require('p2plex')
const ndjson = require('ndjson')
const pump = require('pump')

const Encoder = require('./')
const EncoderDecoder = require('../EncoderDecoder')

run()

async function run () {
  const sdk1 = await SDK({
    storage: RAM
  })
  const sdk2 = await SDK({
    storage: RAM
  })

  const plex = p2plex()

  const encoder = await Encoder.load({
    sdk: sdk1,
    EncoderDecoder
  })

  const TEST_MESSAGE = Buffer.from('Hello World!')

  plex.on('connection', async (peer) => {
    console.log('Got connection from encoder', peer.publicKey, peer.publicKey.equals(encoder.publicKey))

    const responseStream = ndjson.serialize()
    const encodingStream = ndjson.parse()

    pump(responseStream, peer.receiveStream('datdot-encoding-results'), encodingStream)

    for await (const { feed, index, encoded, proof } of encodingStream) {
      const encodedBuff = Buffer.from(encoded)
      const feedBuff = Buffer.from(feed)

      const decoded = await EncoderDecoder.decode(encodedBuff)
      const isSame = TEST_MESSAGE.equals(decoded)

      console.log('Got encoding', { feedBuff, index, encodedBuff, decoded, isSame })

      // Respond to the peer saying we got the data
      responseStream.send({
        type: 'encoding',
        ok: true
      })
    }
  })

  console.log('initializing feed')
  const feed = sdk2.Hypercore('Example Feed')

  await feed.append(TEST_MESSAGE)

  console.log('Sending feed to be encoded', {
    publicKey: communication2.publicKey.toString('hex'),
    feed: feed.key.toString('hex'),
    index: 0
  })

  await encoder.encodeFor(communication2.publicKey, feed.key, 0)

  console.log('Done!')

  await sdk1.close()
  await sdk2.close()
}
