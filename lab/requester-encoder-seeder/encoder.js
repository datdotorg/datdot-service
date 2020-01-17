const compress = require('iltorb').compress;
const decompress = require('iltorb').decompress;
const fetch = require('node-fetch')
const fs = require('fs')
const blake2b = require('blake2b')
const Hypercore = require('hypercore')
const ram = require('random-access-memory')

// const origHypercoreKey = 'a45b15bae23f8678ceb768d1af9490e2c5ade0047916894a9d6dc4c106788ae6'
const hyperswarm = require('hyperswarm')
const colors = require('colors/safe');
const NAME = __filename.split('/').pop().split('.')[0].toUpperCase()
const ERROR = `404 - not found`
function LOG (...msgs) {
  msgs = [`[${NAME}] `, ...msgs].map(msg => colors.blue(msg))
  console.log(...msgs)
}

start()

function start () {
  var origHypercoreKey
  var encodedHypercore = Hypercore('./hypercore-encoded')
  encodedHypercore.ready(() => {
    LOG('Encoded hypercore key: ', encodedHypercore.key.toString('hex'))
    getKey()
  })
  async function getKey() {
    // @TODO: if the request is made TOO EARLY (=requester didn't publish address yet)
    // => THEN try again a bit later
    var addressEncoded = encodedHypercore.key.toString('hex')
    origHypercoreKey = await fetch(`http://localhost:8989/feed2?dat=${addressEncoded}`)
      .then(response => response.status === 404 ? ERROR : response.text())
      LOG(`origHypercoreKey: ${origHypercoreKey}`)


    if (origHypercoreKey === ERROR) setTimeout(getKey, 1000)
    else continueWithRest()
  }
  function continueWithRest() {
    const key = Buffer.from(origHypercoreKey, "hex")
    const origHypercore = new Hypercore(ram, key)

    const swarm = hyperswarm()
    swarm.join(key, {
      lookup: true, // find & connect to peers
      announce: true // optional- announce self as a connection target
    })
    swarm.on('connection', function (socket, info) {
      LOG('New connection')
      socket.pipe(origHypercore.replicate(info.client)).pipe(socket)
    })
    origHypercore.on('peer-add', (peer) => {
      LOG('got peer')
    })
    origHypercore.ready(() => {
      LOG('Loaded origHypercore')
      reallyReady(origHypercore, () => {
        LOG('READY')
        //test
        // var d = Buffer.from('foo bar baz')
        // compress(d, (err, encodedChunk) => {
        //   LOG(`Encoded chunk: ${encodedChunk.toString('utf8')}`)
        //   encodedHypercore.append(encodedChunk, (err) => {
        //     if (err) LOG(err)
        //   })
        // })
        //end of test

        joinSwarm()
        origHypercore.createReadStream()
          .on('data', chunk => {
            LOG(`Original chunk: ${chunk.toString('utf8')}`)
            compress(chunk, (err, encodedChunk) => {
              LOG(`Encoded chunk: ${encodedChunk.toString('utf8')}`)
              encodedHypercore.append(encodedChunk, (err) => {
                if (err) LOG(err)
              })
            })

          })
          .on('end', console.log.bind(console, '\n(end)'))
      })
    })
    function joinSwarm () {
      const swarm1 = hyperswarm()
      swarm1.join(encodedHypercore.key, {
        lookup: true, // find & connect to peers
        announce: true // optional- announce self as a connection target
      })
      swarm1.on('connection', function (socket, info) {
        // LOG('New connection')
        socket.pipe(encodedHypercore.replicate(info.client)).pipe(socket)
      })
    }
  }
}

function reallyReady (origHypercore, cb) {
  if (origHypercore.peers.length) {
    origHypercore.update({ ifAvailable: true }, cb)
  } else {
    origHypercore.once('peer-add', () => {
      origHypercore.update({ ifAvailable: true }, cb)
    })
  }
}
