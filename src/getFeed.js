const Hypercore = require('hypercore')
const hyperswarm = require('hyperswarm')
const swarm = hyperswarm()
const ram = require('random-access-memory')
const feeds = {}
const pump = require('pump')

const colors = require('colors/safe')
const NAME = __filename.split('/').pop().split('.')[0].toUpperCase()
function LOG (...msgs) {
  msgs = [`[${NAME}] `, ...msgs].map(msg => colors.yellow(msg))
  console.log(...msgs)
}

module.exports = getData

function getData (account) {
  return new Promise(async (resolve, reject) => {
    const feed = account.Hypercore('Datdot MVP')
    await feed.ready()
    await feed.append('Hello World!')
    await feed.append('Pozdravljen svet!')
    await feed.append('你好，世界!')
    await feed.append('Hola Mundo!')
    await feed.append('สวัสดีชาวโลก!')
    await feed.append('Hallo Welt!')
    await feed.append('Bonjour le monde!')
    await feed.append('Здраво Свете!')
    await feed.append('Hai dunia!')
    const data = []
    const feed_pubkey = feed.key
    feed.rootHashes(feed.length - 1, (err, res) => {
      if (err) return LOG(err) && reject(err)
      const children = res.map(renameProperties)
      feed.signature((err, { signature }) => {
        if (err) LOG(err) && reject(err)
        data.push(feed_pubkey)
        LOG('New data feed created', feed_pubkey, feed_pubkey.toString('hex') )
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
