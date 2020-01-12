const brotli = require('brotli')
const hypercore = require('hypercore')
const ram = require('random-access-memory')
const fs = require('fs')


const encodedFeedKey = '14cf4dc3ee161b860b1de29983c4fad9b6dc9964ffea47c5d70e968b105e3982'
const hyperswarm = require('hyperswarm')

const key = Buffer.from(encodedFeedKey, "hex")
const feed = new hypercore(ram, key)

const swarm = hyperswarm()

swarm.join(key, {
  lookup: true, // find & connect to peers
  announce: true // optional- announce self as a connection target
})
swarm.on('connection', function (socket, info) {
  console.log('New connection')
  socket.pipe(feed.replicate(info.client)).pipe(socket)
})
feed.on('peer-add', (peer) => {
  console.log('got peer')
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
    .on('data', res => {
      console.log(res)
      const decodedChunk = brotli.decompress(res);
      console.log('Decoded chunk: ', decodedChunk)
      fs.writeFile('decoded.js', decodedChunk, (err) => {
        if (err) throw err;
        console.log('File DECODED and saved!');
      });
    })
    .on('end', console.log.bind(console, '\n(end)'))
}
