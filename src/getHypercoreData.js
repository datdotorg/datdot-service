const Hypercore = require('hypercore')
const hyperswarm = require('hyperswarm')
const swarm = hyperswarm()
const ram = require('random-access-memory')
const feeds = {}

const colors = require('colors/safe')
const NAME = __filename.split('/').pop().split('.')[0].toUpperCase()
function LOG (...msgs) {
  msgs = [`[${NAME}] `, ...msgs].map(msg => colors.yellow(msg))
  console.log(...msgs)
}

module.exports = new Promise(getData)

async function getData (resolve, reject) {
  makeHypercore((err, hypercore) => {
    if (err) return reject(err)
    const data = []
    const feed_pubkey = hypercore.key
    hypercore.rootHashes(hypercore.length - 1, (err, res) => {
      if (err) return LOG(err) && reject(err)
      const children = res.map(renameProperties)
      hypercore.signature((err, { signature }) => {
        if (err) LOG(err) && reject(err)
        data.push(feed_pubkey)
        LOG('Feed key', feed_pubkey )
        data.push({ hashType: 2, children }) // push TreeHashPayload
        data.push(signature)
        resolve(data)
      })
    })
  })
}
function renameProperties (root) {
  return { hash: root.hash, hash_number: root.index, total_length: root.size }
}
function makeHypercore (cb) {
  const feed = Hypercore(ram, { valueEncoding: 'json' })
  feed.append({
    hello: 'world'
  })

  feed.append({
    hej: 'verden'
  })

  feed.append({
    hola: 'mundo'
  })
  feed.flush(function () {
    console.log('Appended 3 more blocks, %d in total (%d bytes)\n', feed.length, feed.byteLength)
    cb(null, feed)
    const swarm = hyperswarm()
    swarm.join(feed.key, {
      lookup: true, // find & connect to peers
      announce: true // optional- announce self as a connection target
    })

    swarm.on('connection', (socket, details) => {
      console.log('new connection!')
      socket.pipe(feed.replicate(details.client)).pipe(socket)
    })
  })
}
