const WebSocket = require('ws')
const getLogAPI = require('./logAPI')
// const debug = require('debug')

init()

async function init () {
  const [json] = process.argv.slice(2)
  const config = JSON.parse(json)
  const logurl = config.log.join(':')
  const [host, PORT] = config.chat

  const name = `chatserver`
  const log = await getLogAPI(name, logurl)
  // const log = debug(`chatserver`)

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
      if (type === 'join') {
        if (!connections[name]) {
          connections[name] = { name, counter: id, ws }
          log('history', history)
          history.forEach(body => {
            log(`tell to [${name}]`, body)
            ws.send(JSON.stringify(body))
          })
          return log(type, flow)
        } else {
          log('ERROR', type, flow)
          return ws.send(JSON.stringify({
            cite: [flow], type: 'error', body: 'name is already taken'
          }))
        }
      }
      log(`[${name}] says:`, body)
      history.push(body)
      Object.values(connections).map(({ ws, name }) => {
        // log(`tell to [${name}]`, body)
        ws.send(JSON.stringify(body))
      })
    })
  })
}
