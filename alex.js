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
  console.log('Encoded hypercore key: ', encodedFeed.key.toString('hex'))
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
  var init = 0
  feed.createReadStream()
    .on('data', buf0 => {
      if (init) return
      init = 1
      const randomNum = Math.floor(Math.random() * 100)
      console.log('\n\n[original data1:]')
      console.log(buf0)
      console.log(buf0.toString())
      // const chunk = res.toString('utf8')
      // console.log('LOGGING chunk')
      // console.log(chunk)
      fs.readFile('./decoded.js', (err, buf1) => {
      console.log('\n\n[original data2:]')
      console.log(buf1)
      console.log(buf1.toString())
        const uint8array = brotli.compress(buf1, {
          mode: 0, // 0 = generic, 1 = text, 2 = font (WOFF2)
          quality: 11, // 0 - 11
          lgwin: 1 // window size
        })
        console.log('\n\n[compressed data:]')
        console.log(uint8array)
    })
      // console.log('LOGGING content')
      // console.log(content)
      // const uncompressed = new TextDecoder("utf-8").decode(content)
      // console.log(uncompressed)

      // fs.writeFile('./decoded-file.js', buf0, (err) => {
      //     if (err) throw err;
      //     fs.readFile('./decoded-file.js', (err, buf1) => {
      //         if (err) throw err;
      //         var compressed = brotli.compress(buf1)
      //         console.log('compressed data:')
      //         console.log(compressed)
      //         var string1 = new TextDecoder("utf-8").decode(compressed)
      //         console.log(string1)
      //         fs.writeFile('./encoded-file.js', buf1, (err) => {
      //             if (err) throw err;
      //             fs.readFile('./decoded-file.js', (err, buf2) => {
      //                 if (err) throw err;
      //                 var decompressed = brotli.decompress(buf2, buf1.length)
      //                 var string2 = new TextDecoder("utf-8").decode(decompressed)
      //                 console.log('decompressed data:')
      //                 console.log(string2)
      //             })
      //         })
      //     })
      // })

              // console.log('loaded file')
              // console.log(buf.toString())// decode a buffer where the output size is known

// brotli.decompress(compressedData, uncompressedLength);

// decode a buffer where the output size is not known
// ;
// brotli.compress(buffer, isText = false)
// Compresses the given buffer. Pass optional parameters as the second argument.

// encode a buffer of binary data
// brotli.compress(fs.readFileSync('myfile.bin'));

// encode some data with options (default options shown)
// brotli.compress(fs.readFileSync('myfile.bin'), {
  // mode: 0, // 0 = generic, 1 = text, 2 = font (WOFF2)
  // quality: 11, // 0 - 11
  // lgwin: 22 // window size
// });




          // })
          // const data = brotli.decompress(encodedFile);
          // console.log(encodedFile.toString())
            // console.log(data.toString())

          // fs.writeFile('brotli/decoded.js', decoded(), (err) => {
          //   if (err) throw err;
          //   console.log('File DECODED and saved!');
          // });
      // });


      // ---------------------------------------------------
      // // const chunk = res
      // const chunk = res.toString('utf8')
      // console.log(chunk)
      // const encodedChunk = brotli.compress(chunk, {
      //   mode: 0, // 0 = generic, 1 = text, 2 = font (WOFF2)
      //   quality: 1, // 0 - 11
      //   lgwin: 50 // window size
      // })
      // console.log('Encoded chunk', encodedChunk)
      // encodedFeed.append(encodedChunk)
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
