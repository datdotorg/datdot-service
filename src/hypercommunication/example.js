const SDK = require('dat-sdk')
const RAM = require('random-access-memory')

const HyperCommunication = require('./')

run()

async function run () {
  const sdk1 = await SDK({
    storage: RAM
  })
  const sdk2 = await SDK({
    storage: RAM
  })

  const communication1 = await HyperCommunication.create({ sdk: sdk1 })
  const communication2 = await HyperCommunication.create({ sdk: sdk2 })

  console.log('Peer1:', communication1.publicKey)
  console.log('Peer2:', communication2.publicKey)

  communication1.on('message', (message, peer) => {
    console.log('Got message from peer2', message.toString('utf8'))
    peer.send('Hello, you!')
    peer.close()
  })

  const peer1 = await communication2.findPeer(communication1.publicKey)

  peer1.on('close', () => {
    sdk1.close()
    sdk2.close()
  })
  peer1.on('message', (message) => console.log('Message from peer1', message.toString('utf8')))
  peer1.send('Hello World!')
}
