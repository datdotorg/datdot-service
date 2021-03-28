const Hypercore = require('hypercore')
const reallyReady = require('hypercore-really-ready')
const ram = require('random-access-memory')
const hyperswarm = require('hyperswarm')

module.exports = get_feed_metadata

async function get_feed_metadata (log, feedkey, topic) {
  // console.log({log})
  // console.log({feedkey})
  // console.log({topic})
  return new Promise(async (resolve, reject) => {
    const keyBuf = Buffer.from(feedkey, 'hex')
    const topicBuf = Buffer.from(topic, 'hex')
    const feed = new Hypercore(ram, keyBuf)
    await feed.ready()

    const swarm = hyperswarm()
    swarm.join(topicBuf, { lookup: true })

    swarm.on('connection', async (socket, info) => {
      log({ type: 'feed', data: [`Connected to the author, getting the data`] })
      socket.pipe(feed.replicate(info.client)).pipe(socket)

      const data = []
      const feedPubkey = feed.key
      feed.rootHashes(feed.length - 1, (err, res) => {
        if (err) return log({ type: 'error', data: [`Error: ${err}`] }) && reject(err)


        const children = res.map(renameProperties)
        feed.signature((err, { signature }) => {
          if (err) log({ type: 'error', data: [`Error: ${err}`] }) && reject(err)
          data.push(feedPubkey)
          log({ type: 'feed', data: [`New data feed created ${feedPubkey} ${feedPubkey.toString('hex')}`] })
          data.push({ hashType: 2, children }) // push TreeHashPayload
          data.push(signature)
          swarm.leave(topicBuf)
          resolve(data)
        })
      })
    })

  })

  function renameProperties (root) {
    return { hash: root.hash, hash_number: root.index, total_length: root.size }
  }

}
