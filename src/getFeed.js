const Hypercore = require('hypercore')
const reallyReady = require('hypercore-really-ready')
const ram = require('random-access-memory')
const hyperswarm = require('hyperswarm')
const swarm = hyperswarm()

const debug = require('debug')
const ROLE = __filename.split('/').pop().split('.')[0].toLowerCase()

module.exports = getData

async function getData (feedkey, swarmkey) {
  const log = debug(`[${ROLE}]`)

  return new Promise(async (resolve, reject) => {
    const key = Buffer.from(feedkey, 'hex')
    const topic = Buffer.from(swarmkey, 'hex')
    const feed = new Hypercore(ram, key)
    await feed.ready()
    log('Connecting to the swarm and getting data about the feed', feed)

    swarm.join(topic, { lookup: true })

    debugger
    swarm.on('connection', async (socket, info) => {
      console.log('Connected to the publisher')
      socket.pipe(feed.replicate(info.client)).pipe(socket)

      const data = []
      const feedPubkey = feed.key
      log('feedPubkey: ', feedPubkey)
      feed.rootHashes(feed.length - 1, (err, res) => {
        if (err) return log(err) && reject(err)
        const children = res.map(renameProperties)
        feed.signature((err, { signature }) => {
          if (err) log(err) && reject(err)
          data.push(feedPubkey)
          console.log('New data feed created', feedPubkey, feedPubkey.toString('hex'))
          data.push({ hashType: 2, children }) // push TreeHashPayload
          data.push(signature)
          log('DATA: ', data)
          leave(topic)
          resolve(data)
        })
      })
    })
  })

  function renameProperties (root) {
    return { hash: root.hash, hash_number: root.index, total_length: root.size }
  }

  async function leave (topic) {
    return new Promise((resolve) => {
      swarm.leave(topic, resolve)
    })
  }

}
