const WebSocket = require('ws')
const debug = require('debug')

const log = debug(`log`)


const [json] = process.argv.slice(2)
const config = JSON.parse(json)
const [host, PORT] = config.log

const wss = new WebSocket.Server({ port: PORT }, after)

function after () {
  log(`running on http://localhost:${wss.address().port}`)
}

const connections = {}
const history = []

wss.on('connection', function connection (ws) {
  ws.on('message', function incoming (message) {
    message = JSON.parse(message)
    const { flow, type, body } = message
    const [name, id] = flow
    if (type === 'debug') {
      log(`ERROR`, 'doesnt exist yet')
    }
    if (type === 'connect') {
      if (!connections[name]) {
        connections[name] = { name, counter: id, ws }
        // history.forEach(message => {
        //   log(`[to   ${name}]:`, message)
        //   ws.send(JSON.stringify(message))
        // })
        return log(type, flow)
      } else {
        log(`ERROR`, message)
        return ws.send(JSON.stringify({
          cite: [flow], type: 'error', body: 'name is already taken'
        }))
      }
    }
    const logger = log.extend(name)
    logger(id, body)
    history.push(message)
    // Object.values(connections).map(({ ws, name: peer }) => {
    //   if (name === peer) return
    //   log(`[to   ${peer}]:`, message)
    //   ws.send(JSON.stringify(message))
    // })
  })
})
