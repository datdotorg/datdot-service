const WebSocket = require('ws')
const debug = require('debug')

const log = debug(`chatserver`)

const [url] = process.argv.slice(2)
const PORT = url.split(':').pop()

const wss = new WebSocket.Server({ port: PORT }, after)

function after () {
  log(`running on http://localhost:${wss.address().port}`)
}

const connections = {}
const history = []

wss.on('connection', function connection (ws) {
  ws.on('message', function incoming (message) {
    const { flow, type, body } = JSON.parse(message)
    const [name, id] = flow
    if (type === 'join') {
      if (!connections[name]) {
        connections[name] = { name, counter: id, ws }
        history.forEach(body => {
          log(`tell to [${name}]`, body)
          ws.send(JSON.stringify(body))
        })
        return log(type, flow)
      } else {
        log('error:', type, flow)
        return ws.send(JSON.stringify({
          cite: [flow], type: 'error', body: 'name is already taken'
        }))
      }
    }
    log(`[${name}] say:`, body)
    history.push(body)
    Object.values(connections).map(({ ws, name }) => {
      log(`tell to [${name}]`, body)
      ws.send(JSON.stringify(body))
    })
  })
})
