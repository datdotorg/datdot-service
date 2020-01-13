const decompress = require('iltorb').decompress;
const hypercore = require('hypercore')
const ram = require('random-access-memory')
const fs = require('fs')


const encodedFeedKey = '49d71ef6597e31b2e05b72eb5dc09ae59b559a8608800296c0cb402e18c9e25a'
const hyperswarm = require('hyperswarm')

const key = Buffer.from(encodedFeedKey, "hex")
const feed = new hypercore(ram, key)

const swarm = hyperswarm()

swarm.join(key, {
  lookup: true, // find & connect to peers
  announce: true // optional- announce self as a connection target
})
swarm.on('connection', function (socket, info) {
  // console.log('New connection')
  socket.pipe(feed.replicate(info.client)).pipe(socket)
})
feed.on('peer-add', (peer) => {
  // console.log('got peer')
})

feed.ready(() => {
  console.log('Loaded feed', feed)
  reallyReady(feed, () => {
    console.log('READY')
    decodeFeed()
  })
})

function reallyReady (feed, cb) {
  if (feed.peers.length) {
    feed.update({ ifAvailable: true }, cb)
  } else {
    feed.once('peer-add', () => {
      feed.update({ ifAvailable: true }, cb)
    })
  }
}

function decodeFeed () {
  console.log('Decoding feed')
  feed.createReadStream()
    .on('data', chunk => {
      console.log('CHUNK', chunk.toString('utf8'))
      // const compressed = fs.readFileSync('compressed.js')
      // console.log('COMPRESSED', compressed)
      decompress(chunk, (err, decodedChunk) => {
        if (err) console.log(err)
        const decompressed = new TextDecoder("utf-8").decode(decodedChunk)
        console.log('Decoded chunk - parsed: ', decompressed )
      });
    })
    .on('end', console.log.bind(console, '\n(end)'))
}
