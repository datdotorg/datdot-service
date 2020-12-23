const WebSocket = require('ws')

module.exports = getChatAPI
var instance = void 0

async function getChatAPI (profile, provider) {
  if (instance) throw new Error('only one chat API per process')
  instance = true
  const { name, log } = profile
  if (!log) throw new Error('missing param `log`')
  if (!name) throw new Error('missing param `name`')
  var counter = 0 // message id counter
  return new Promise(connect)
  function connect (resolve, reject) {
    var ws = new WebSocket(provider)
    instance = {
      on: callback => ws.on('message', json => {
        const body = JSON.parse(json)
        log({ type: 'chat', body: [`received ${body}`]})
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
      resolve(instance)
    })
    ws.on('close', function close () {
      console.error('unexpected closing of chat connection for', name)
    })
    ws.on('error', function error (err) {
      setTimeout(() => connect(resolve, reject), 2000)
    })
  }
}
