const Hypercore = require('hypercore')
const reallyReady = require('hypercore-really-ready')
const ram = require('random-access-memory')
const hyperswarm = require('hyperswarm')
/******************************************************************************
  ROLE: Author
******************************************************************************/

module.exports = role

// MAKE FEED and SEED IT

async function role (profile, APIS) {
  const { log } = profile
  const getChatAPI = require('../../lab/scenarios/chatAPI')
  const chatAPI = await getChatAPI(profile, ['ws://localhost', '8000'].join(':'))

  log({ type: 'author', body: [`Make a feed and share it`] })

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
  await feed.append('Mhoro nyika!')
  await feed.append('Salom Dunyo!')
  await feed.append('Halo Dunia!')
  await feed.append('Kumusta kalibutan!')
  await feed.append('Hei Verden!')
  await feed.append('Ahoj svet!')
  await feed.append('Hej världen!')
  await feed.append('Helló Világ!')

  await reallyReady(feed)
  const feedkey = feed.key
  const topic = feed.discoveryKey
  const swarm = hyperswarm()
  swarm.join(topic, { announce: true, lookup: false })


  swarm.on('connection', (socket, info) => {
    log({ type: 'author', body: [`new connection!`] })
    socket.pipe(feed.replicate(info.client)).pipe(socket)
  })

  const keys = { feedkey, topic }
  log({ type: 'author', body: [`Send the keys ${keys}`] })
  chatAPI.send(JSON.stringify(keys))
  return keys
}
