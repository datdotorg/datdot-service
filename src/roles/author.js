const Hypercore = require('hypercore')
const reallyReady = require('hypercore-really-ready')
const ram = require('random-access-memory')
const hyperswarm = require('hyperswarm')
const debug = require('debug')

/******************************************************************************
  ROLE: Author
******************************************************************************/
const ROLE = __filename.split('/').pop().split('.')[0].toLowerCase()

module.exports = role

// MAKE FEED and SEED IT

async function role ({ name }) {
  const log = debug(`[${name.toLowerCase()}:${ROLE}]`)
  const feed = Hypercore(ram)

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

  const feedkey = feed.key
  const swarmkey = feed.discoveryKey

  const swarm = hyperswarm()
  swarm.join(swarmkey, { lookup: true, announce: true })

  await reallyReady(feed)

  swarm.on('connection', (socket, info) => {
    console.log('new connection!')
    // you can now use the socket as a stream, eg:
    socket.pipe(feed.replicate(info.client)).pipe(socket)
  })
  log('Feedkey', feedkey.toString('hex'))
  log('Swarmkey', swarmkey.toString('hex'))
  return({ feedkey,swarmkey })
}
