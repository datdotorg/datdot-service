const compress = require('iltorb').compress;
const decompress = require('iltorb').decompress;
const fs = require('fs')
const blake2b = require('blake2b')
const hypercore = require('hypercore')
const ram = require('random-access-memory')

const origFeedKey = 'a45b15bae23f8678ceb768d1af9490e2c5ade0047916894a9d6dc4c106788ae6'
const hyperswarm = require('hyperswarm')

const key = Buffer.from(origFeedKey, "hex")
const feed = new hypercore(ram, key)
const encodedFeed = hypercore('./encoded-feed')
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
    encodeFeed()
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

function encodeFeed () {
  console.log('Encoded hypercore key: ', encodedFeed.key.toString('hex'))
  const swarm1 = hyperswarm()
  swarm1.join(encodedFeed.key, {
    lookup: true, // find & connect to peers
    announce: true // optional- announce self as a connection target
  })
  swarm1.on('connection', function (socket, info) {
    // console.log('New connection')
    socket.pipe(encodedFeed.replicate(info.client)).pipe(socket)
  })
  var init = 0
  feed.createReadStream()
    .on('data', chunk => {
      console.log('Original Chunk', chunk.toString('utf8'))
      compress(chunk, (err, encodedChunk) => {
        console.log('Encoded chunk', encodedChunk.toString('utf8'))
        encodedFeed.append(encodedChunk, (err) => {
          if (err) console.log(err)
        })
        // fs.writeFile('compressed.js', encodedChunk, (err) => {
        //     if (err) throw err;
        //     console.log('File encoded and saved!');
        //     console.log(encodedChunk)
        // });
      })
    })
    .on('end', console.log.bind(console, '\n(end)'))
}

// prepend data so chunks are big enough or configure brotli
// compress data => you get Uint8Array
// check if you can append uint8Uint8Array to hypercore feed (onyl buffers or strings)
