const WebSocket = require('ws')

module.exports = getChatAPI
const connections = {}

async function getChatAPI (profile, provider) {
  const { name = '<anonymous>' } = profile
  var counter = 0
  if (connections[name]) return new Promise(resolve => {
    resolve(connections[name])
  })
  return new Promise(connect)
  function connect (resolve, reject) {
    var ws = new WebSocket(provider)
    connections[name] = {
      on: callback => ws.on('message', json => {
        const body = JSON.parse(json)
        profile.log('received', body)
        callback(body)
      }),
      send: body => ws.send(JSON.stringify({
        flow: [name, counter++],
        type: 'say',
        body: body,
      })),
    }
    ws.on('open', function open () {
      const flow = [name, counter++]
      ws.send(JSON.stringify({ flow, type: 'join' }))
      resolve(connections[name])
    })
    ws.on('error', function error (err) {
      setTimeout(() => connect(resolve, reject), 2000)
    })
  }
}
