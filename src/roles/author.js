const hypercore = require('hypercore')
const hyperswarm = require('hyperswarm')
const RAM = require('random-access-memory')
const get_signature = require('get-signature')
const ready = require('hypercore-ready')
const verify_signature = require('verify-signature')
const append = require('hypercore-append')
/******************************************************************************
  ROLE: Author
******************************************************************************/

module.exports = role

// MAKE FEED and SEED IT

async function role (profile, APIS) {
  const { log } = profile
  const getChatAPI = require('../../lab/simulations/chatAPI')
  const chatAPI = await getChatAPI(profile, ['ws://localhost', '8000'].join(':'))

  log({ type: 'author', data: [`Make a feed and share it`] })

  const feed = new hypercore(RAM, { valueEncoding: 'utf-8' })
  await ready(feed)

  await append(feed, 'Hello World!')
  await append(feed, 'Pozdravljen svet!')
  await append(feed, '你好，世界!')
  await append(feed, 'Hola Mundo!')
  await append(feed, 'สวัสดีชาวโลก!')
  await append(feed, 'Hallo Welt!')
  await append(feed, 'Bonjour le monde!')
  await append(feed, 'Здраво Свете!')
  await append(feed, 'Hai dunia!')
  await append(feed, 'Mhoro nyika!')
  await append(feed, 'Salom Dunyo!')
  await append(feed, 'Halo Dunia!')
  await append(feed, 'Kumusta kalibutan!')
  await append(feed, 'Hei Verden!')
  await append(feed, 'Ahoj svet!')
  await append(feed, 'Hej världen!')
  await append(feed, 'Helló Világ!')

  const feedkey = feed.key
  const topic = feed.discoveryKey
  const swarm = hyperswarm()
  swarm.join(topic, { announce: true, lookup: false })


  swarm.on('connection', (socket, info) => {
    log({ type: 'author', data: [`new connection!`] })
    socket.pipe(feed.replicate(info.client)).pipe(socket)
  })

  const keys = { feedkey, topic }
  log({ type: 'author', data: [`Send the keys ${keys}`] })
  chatAPI.send(JSON.stringify(keys))
  return keys
}
