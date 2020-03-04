const decompress = require('iltorb').decompress;
const Hypercore = require('hypercore')
const fetch = require('node-fetch')
const ram = require('random-access-memory')
const fs = require('fs')
// const encodedHypercoreKey = '49d71ef6597e31b2e05b72eb5dc09ae59b559a8608800296c0cb402e18c9e25a'
const hyperswarm = require('hyperswarm')
const colors = require('colors/safe');
const NAME = __filename.split('/').pop().split('.')[0].toUpperCase()
const ERROR = `404 - not found`
function LOG (...msgs) {
  msgs = [`[${NAME}] `, ...msgs].map(msg => colors.green(msg))
  console.log(...msgs)
}

start()

function start () {
  var encodedHypercoreKey

  getKey()

  async function getKey () {
    encodedHypercoreKey = await fetch(`http://localhost:8989/feed3`)
      .then(response => response.status === 404 ? ERROR : response.text())
    LOG(encodedHypercoreKey)
    if (encodedHypercoreKey === ERROR) setTimeout(getKey, 1000)
    else continueWithRest()
  }
  function continueWithRest() {
    const key = Buffer.from(encodedHypercoreKey, "hex")
    LOG(`Key is: ${encodedHypercoreKey}`)
    const hypercore = new Hypercore(ram, key)
    const swarm = hyperswarm()
    swarm.join(key, {
      lookup: true, // find & connect to peers
      announce: true // optional- announce self as a connection target
    })
    swarm.on('connection', function (socket, info) {
      // LOG('New connection')
      socket.pipe(hypercore.replicate(info.client)).pipe(socket)
    })
    hypercore.on('peer-add', (peer) => {
      // LOG('got peer')
    })

    hypercore.ready(() => {
      reallyReady(hypercore, () => {
        LOG(`READY`)
        decodeHypercore()
      })
    })

    function decodeHypercore () {
      LOG(`Decoding hypercore`)
      hypercore.createReadStream()
        .on('data', chunk => {
          // const compressed = fs.readFileSync('compressed.js')
          // LOG('COMPRESSED', compressed)
          decompress(chunk, (err, decodedChunk) => {
            if (err) LOG(err)
            const decompressed = new TextDecoder("utf-8").decode(decodedChunk)
            LOG(`Decoded chunk: ${decompressed} `)
          });
        })
        .on('end', console.log.bind(console, '\n(end)'))
    }
  }
}



function reallyReady (hypercore, cb) {
  if (hypercore.peers.length) {
    hypercore.update({ ifAvailable: true }, cb)
  } else {
    hypercore.once('peer-add', () => {
      hypercore.update({ ifAvailable: true }, cb)
    })
  }
}
