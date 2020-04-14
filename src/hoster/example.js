const SDK = require('dat-sdk')
const RAM = require('random-access-memory')
const levelup = require('levelup')
const memdown = require('memdown')

const Hypercommunication = require('../hypercommunication')
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

    var communication = await Hypercommunication.create({ sdk: sdk1 })

    console.log('Initializing hoster')
    var hoster = await Hoster.load({
      sdk: sdk1,
      EncoderDecoder,
      db,
      communication,
      onNeedsEncoding
    })

    console.log('Initializing feed')
    var sdk2 = await SDK({
      storage: RAM
    })
    var communication2 = await Hypercommunication.create({ sdk: sdk2 })

    // - Initialize a feed
    var feed = sdk2.Hypercore('Example Feed')

    await feed.append('Hello')
    await feed.append('World')

    console.log('Adding feed to hoster')
    await hoster.addFeed(feed.key)
  } catch (e) {
    console.error(e.stack)
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

    console.log('Storing data for', key, index)

    const peer = await communication2.findPeer(communication.publicKey)

    setTimeout(() => {
    peer.send({
      type: 'encoded',
      feed: key,
      index,
      encoded,
      proof
    })
    }, 1000)

    const message = await new Promise((resolve, reject) => {
      peer.once('message', (message) => {
        if (message.error) reject(Object.assign(new Error(message.error), message))
        else resolve(message)
      })
    })

    console.log('Storage result:', message)
  }
}
