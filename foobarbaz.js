const hypercore = require('hypercore')
const hyperswarm = require('hyperswarm')
const RAM = require('random-access-memory')

make_feed()

async function make_feed () {
  const feed = new hypercore(RAM, { valueEncoding: 'utf-8' })
  await ready(feed)  

  await append(feed, 'foo')
  await append(feed, 'bar')
  await append(feed, 'baz')

  get_and_verify_signatures(feed)

  const feedkey = feed.key
  const topic = feed.discoveryKey
  const swarm = hyperswarm()
  swarm.join(topic, { announce: true, lookup: false })
  swarm.on('connection', (socket, info) => {
    socket.pipe(feed.replicate(info.client)).pipe(socket)
  })
  await clone_feed(feedkey, topic) 
}

async function clone_feed (feedkey, topic) {
  const feed = new hypercore(RAM, feedkey, { valueEncoding: 'utf-8' })
  await ready(feed)
  const swarm = hyperswarm()
  swarm.join(topic,  { announce: false, lookup: true })
  swarm.on('connection', async (socket, info) => {
    socket.pipe(feed.replicate(info.client)).pipe(socket)
    console.log('new connection')
    feed.on('sync', () => {
      audit(feed)
      // get_and_verify_signatures(feed)
      swarm.leave(topic)
    })
  })
}

async function get_and_verify_signatures (feed) {
  for (var i = 0, len = feed.length; i < len; i++) {
    const index = i
    const signature = await get_signature(feed, index)
    console.log({signature})
    const is_verified = await verify_signature(feed, index, signature)
    console.log(is_verified)
  }
}

async function audit (feed) {
  return new Promise ((resolve, reject) => {
    feed.audit((err, res) => {
      console.log({err, res})
    })
  })
}


// HELPERS
///////////////////////////////////////////////////////////

async function get_data (feed, index) {
  return new Promise((resolve, reject) => {
    feed.get(index, (err, data) => {
      if (err) reject(err)
      resolve(data)
    })
  })
}

async function append (feed, data) {
  return new Promise ((resolve, reject) => {
    feed.append(data, (err, res) => {
      if (err) reject(err) 
      resolve(res)
    })
  })
}

async function ready (feed) {
  return new Promise ((resolve, reject) => {
    if (feed.key) resolve()
    feed.on('ready', resolve)
  })
}

async function verify_signature (core, index, signature) {
  return new Promise ((resolve, reject) => {
    core.verify(index, signature, (err, res) => {
      if (err) reject(err) 
      resolve(res)
    })
  })
}

async function get_signature (feed, index) {
  return new Promise((resolve, reject) => {
    feed.signature(index, (err, res) => {
      if (err) reject(err)
      resolve(res.signature) // res = { index, signature }
    })
  }) 
}

async function get_root_sig (feed) {
  return new Promise((resolve, reject) => {
    feed.signature((err, res) => {
      if (err) reject(err)
      resolve(res.signature) // res = { index, signature }
    })
  }) 
}