const RAM = require('random-access-memory')
const SDK = require('dat-sdk')
const Encoder = require('./')
const Hypercommunication = require('../hypercommunication')
const EncoderDecoder = require('../EncoderDecoder')

run()

async function run () {
  const sdk1 = await SDK({
    storage: RAM
  })
  const sdk2 = await SDK({
    storage: RAM
  })

  const communication1 = await Hypercommunication.create({ sdk: sdk1 })
  const communication2 = await Hypercommunication.create({ sdk: sdk2 })

  const encoder = await Encoder.load({
    sdk: sdk1,
    communication: communication1,
    EncoderDecoder
  })

  const TEST_MESSAGE = Buffer.from('Hello World!')

  communication2.on('message', async ({ feed, index, encoded, proof }, peer) => {
    const encodedBuff = Buffer.from(encoded)
    const feedBuff = Buffer.from(feed)

    const decoded = await EncoderDecoder.decode(encodedBuff)
    const isSame = TEST_MESSAGE.equals(decoded)

    console.log('Got encoding', { feedBuff, index, encodedBuff, decoded, isSame })

    // Respond to the peer saying we got the data
    peer.send({
      type: 'encoding',
      ok: true
    })
  })

  console.log('initializing feed')
  const feed = sdk2.Hypercore('Example Feed')

  await feed.append(TEST_MESSAGE)

  console.log('Sending feed to be encoded', {
    publicKey: communication2.publicKey.toString('hex'),
    feed: feed.key.toString('hex'),
    ranges: [[2, 5], [7, 15], [17, 27]]
  })

  await encoder.encodeFor(communication2.publicKey, feed.key, ranges)

  console.log('Done!')

  await sdk1.close()
  await sdk2.close()
}
