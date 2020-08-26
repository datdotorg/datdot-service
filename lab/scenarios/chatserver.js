const WebSocket = require('ws')
const debug = require('debug')

const log = debug(`[chatserver]`)

const [url] = process.argv.slice(2)
const PORT = url.split(':').pop()

const wss = new WebSocket.Server({ port: PORT }, after)

function after () {
  log(`running on http://localhost:${wss.address().port}`)
}

const connections = []
const history = []
wss.on('connection', function connection (ws) {
  ws.on('message', function incoming (message) {
    const { flow: [name, msgid], type, body } = JSON.parse(message)
    if (type === 'join' && !connections[name]) {
      connections[name] = ws
      history.forEach(body => {
        log(`tell to [${name}]`, body)
        ws.send(JSON.stringify(body))
      })
      return log('join:', name)
    }
    log(`[${name}] say:`, body)
    history.push(body)
    Object.entries(connections).map(([name, ws]) => {
      log(`tell to [${name}]`, body)
      ws.send(JSON.stringify(body))
    })
  })
})
