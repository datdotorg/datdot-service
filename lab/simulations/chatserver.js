const WebSocket = require('ws')
const logkeeper = require('./logkeeper')

init()

async function init () {
  const [json, logport] = process.argv.slice(2)
  const config = JSON.parse(json)
  const [host, PORT] = config.chat

  const name = `chatserver`
  const log = await logkeeper(name, logport)

  const wss = new WebSocket.Server({ port: PORT }, after)

  function after () {
    log({ type: 'chat', body: [`running on http://localhost:${wss.address().port}`] })
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
          log({ type: 'chat', body: [`history: ${history}`] })
          history.forEach(body => {
            log({ type: 'chat', body: [`tell to [${name}] ${body}`] })
            ws.send(JSON.stringify(body))
          })
          return log({ type: 'chat', body: [`${type} ${flow}`] })
        } else {
          log({ type: 'error', body: [`${type} ${flow}`] })
          return ws.send(JSON.stringify({
            cite: [flow], type: 'error', body: 'name is already taken'
          }))
        }
      }
      log({ type: 'chat', body: [`[${name}] says: ${body}`] })
      history.push(body)
      Object.values(connections).map(({ ws, name }) => {
        ws.send(JSON.stringify(body))
      })
    })
  })
}
