const Hypercore = require('hypercore')
const reallyReady = require('hypercore-really-ready')
const ram = require('random-access-memory')
const hyperswarm = require('hyperswarm')
const debug = require('debug')
const getChatAPI = require('../../lab/scenarios/chatAPI')
const crypto = require('crypto')

/******************************************************************************
  ROLE: Author
******************************************************************************/
const ROLE = __filename.split('/').pop().split('.')[0].toLowerCase()

module.exports = role

// MAKE FEED and SEED IT

async function role (profile, config) {
  const { name } = profile
  const log = debug(`[${name.toLowerCase()}:${ROLE}]`)
  profile.log = log
  const feed = Hypercore(ram)
  const chatAPI = await getChatAPI(profile, config.chat.join(':'))

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

  await reallyReady(feed)
  const feedkey = feed.key
  const topic = feed.discoveryKey
  const swarm = hyperswarm()
  swarm.join(topic, { announce: true, lookup: false })


  swarm.on('connection', (socket, info) => {
    log('new connection!')
    socket.pipe(feed.replicate(info.client)).pipe(socket)
  })

  const keys = { feedkey, topic }
  log('Send the keys', keys)
  chatAPI.send(JSON.stringify(keys))
  return keys
}
