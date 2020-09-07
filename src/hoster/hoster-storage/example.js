const SDK = require('dat-sdk')
const RAM = require('random-access-memory')
const levelup = require('levelup')
const memdown = require('memdown')
const HosterStorage = require('./')

// Use JSON based encoder and decoder
const EncoderDecoder = require('../EncoderDecoder')

;(async () => {
  // Initialize SDK with in-memory storage
  const sdk1 = await SDK({
    storage: RAM
  })

  // Initialize second SDK in-memory storage
  const sdk2 = await SDK({
    storage: RAM
  })

  try {
  // Initialize feed and add some data to it. Keep it open to replicate
    const writerFeed = sdk1.Hypercore('Example feed')

    const SAMPLE_DATA = Buffer.from('Hello World!')
    const SAMPLE_PROOF = Buffer.from('I swear I have the data, yo')

    console.log('Writing to feed')
    await writerFeed.append(SAMPLE_DATA)

    // Initialize levelup instance with in-memory storage
    const db = levelup(memdown())

    // Initialize feed in second SDK from key in feed, in sparse mode
    const hostedFeed = sdk2.Hypercore(writerFeed.key, {
      sparse: true
    })

    console.log('Initializing host')
    // Pass to storage
    const host = new HosterStorage(EncoderDecoder, db, hostedFeed)

    await reallyReady(hostedFeed)

    // JSON encode the data from the feed
    const encodedData = await EncoderDecoder.encode(SAMPLE_DATA)

    const { nodes, signature } = await writerFeed.proof(0)

    console.log('Storing encoded data in host')
    // Try sending encoding to storage
    await host.storeEncoded(0, SAMPLE_PROOF, encodedData, nodes, signature)

    console.log('Getting data from host')
    // Get the data from the host's feed
    const storedData = await hostedFeed.get(0)

    const isSame = storedData.equals(SAMPLE_DATA)
    console.log('Host data is same:', isSame)

    const { proof } = await host.getStorageChallenge(0)

    const isSameProof = proof.equals(SAMPLE_PROOF)

    console.log('Host returned expected proof:', isSameProof)
  } catch (e) {
    console.error(e.stack)
  } finally {
    setTimeout(() => {
      sdk1.close()
      sdk2.close()
    }, 1000)
  }
})()

async function reallyReady (feed) {
  if (feed.peers.length) {
    return feed.update({ ifAvailable: true })
  } else {
    return new Promise((resolve, reject) => {
      feed.once('peer-add', () => {
        feed.update({ ifAvailable: true }).then(resolve, reject)
      })
    })
  }
}
