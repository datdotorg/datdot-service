const brotli = require('brotli')
const fs = require('fs')
const blake2b = require('blake2b')
const hypercore = require('hypercore')
const ram = require('random-access-memory')

const origFeedKey = 'b2ca1ce20c95cbc594631e18893ce53d5440992ebcfd477035c35a3be001b6ea'
const hyperswarm = require('hyperswarm')

const key = Buffer.from(origFeedKey, "hex")
const feed = new hypercore(ram, key)
const encodedFeed = hypercore('./encoded-feed', {valueEncoding: 'json'})
const swarm = hyperswarm()

swarm.join(key, {
  lookup: true, // find & connect to peers
  announce: true // optional- announce self as a connection target
})
swarm.on('connection', function (socket, info) {
  const {
    priority,
    status,
    retries,
    peer,
    client
  } = info
  console.log('new connection to original!', `
    priority: ${priority}
    status: ${status}
    retries: ${retries}
    client: ${client}
  `)
  socket.pipe(feed.replicate(info.client)).pipe(socket)
})
feed.on('peer-add', (peer) => {
  console.log('got peer for original hypercore')
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
  console.log('Encoded hypercore: ', encodedFeed.key.toString('hex'))
  const swarm1 = hyperswarm()
  swarm1.join(encodedFeed.key, {
    lookup: true, // find & connect to peers
    announce: true // optional- announce self as a connection target
  })
  swarm1.on('connection', function (socket, info) {
    const {
      priority,
      status,
      retries,
      peer,
      client
    } = info
    console.log('new connection!', `
      priority: ${priority}
      status: ${status}
      retries: ${retries}
      client: ${client}
    `)
    socket.pipe(encodedFeed.replicate(info.client)).pipe(socket)
  })
  feed.createReadStream()
    .on('data', res => {
      const randomNum = Math.floor(Math.random() * 100)
      // const chunk = res
      const chunk = res.toString('utf8')
      console.log(chunk.toString('utf8'))
      console.log(chunk.length)
      const len = chunk.length
      const encodedChunk = brotli.compress(chunk, {
        mode: 0, // 0 = generic, 1 = text, 2 = font (WOFF2)
        quality: 11, // 0 - 11
        lgwin: randomNum // window size
      })
      encodedFeed.append(encodedChunk)
    })
    .on('end', console.log.bind(console, '\n(end)'))
}

//
//
// const originalFile= fs.readFileSync('src/types.json')
// const length = originalFile.length
//
// const encoded = function getEncoded () {
//   const content = brotli.compress(originalFile, {
//     mode: 0, // 0 = generic, 1 = text, 2 = font (WOFF2)
//     quality: 11, // 0 - 11
//     lgwin: randomNum // window size
//   })
//
//   const output = new Uint8Array(64)
//   console.log('output', output)
//   const input = Buffer.from(content)
//   console.log('input', input)
//   console.log('hash:', blake2b(output.length).update(input).digest('hex'))
//
//   return content
// }
// const decoded = function getDecoded () {
//   const encodedFile = fs.readFileSync('brotli/encoded.js')
//   return brotli.decompress(encodedFile, length);
// }
//
// fs.writeFile('brotli/encoded.js', encoded(), (err) => {
//     if (err) throw err;
//     console.log('File encoded and saved!');
//
//
//     fs.writeFile('brotli/decoded.js', decoded(), (err) => {
//       if (err) throw err;
//       console.log('File DECODED and saved!');
//     });
// });
