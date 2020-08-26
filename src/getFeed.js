const Hypercore = require('hypercore')
const reallyReady = require('hypercore-really-ready')
const ram = require('random-access-memory')
const hyperswarm = require('hyperswarm')

const debug = require('debug')
const ROLE = __filename.split('/').pop().split('.')[0].toLowerCase()

module.exports = getData

async function getData (feedkey, topic) {
  const log = debug(`[${ROLE}]`)

  return new Promise(async (resolve, reject) => {
    const keyBuf = Buffer.from(feedkey, 'hex')
    const topicBuf = Buffer.from(topic, 'hex')
    const feed = new Hypercore(ram, keyBuf)
    await feed.ready()
    log('Connecting to the swarm and getting data about the feed', feed)

    const swarm = hyperswarm()
    swarm.join(topicBuf, { lookup: true })

    swarm.on('connection', async (socket, info) => {
      console.log('Connected to the author')
      socket.pipe(feed.replicate(info.client)).pipe(socket)

      const data = []
      const feedPubkey = feed.key
      feed.rootHashes(feed.length - 1, (err, res) => {
        if (err) return log(err) && reject(err)
        const children = res.map(renameProperties)
        feed.signature((err, { signature }) => {
          if (err) log(err) && reject(err)
          data.push(feedPubkey)
          console.log('New data feed created', feedPubkey, feedPubkey.toString('hex'))
          data.push({ hashType: 2, children }) // push TreeHashPayload
          data.push(signature)
          swarm.leave(topicBuf)
          resolve(data)
        })
      })
    })

    swarm.on('peer', (peer) => {

    })
  })

  function renameProperties (root) {
    return { hash: root.hash, hash_number: root.index, total_length: root.size }
  }

}
