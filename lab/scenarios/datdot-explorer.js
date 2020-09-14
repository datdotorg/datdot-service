const http = require('http')
const debug = require('debug')
const log = debug(`datdot-explorer`)

const [json, port] = process.argv.slice(2)
const PORTS = JSON.parse(json)

const server = http.createServer(handler)
server.listen(port, function after () {
  log(`running on http://localhost:${this.address().port}`)
})

function handler (request, response) {
  log('request:', request.url)
  switch (request.url) {
    case "/":
      response.setHeader("Content-Type", "text/html")
      response.writeHead(200)
      response.end(explorer(PORTS))
      break
    default:
      response.setHeader("Content-Type", "application/json")
      response.writeHead(404)
      response.end(JSON.stringify({ error: "404 - not found" }))
      break
  }
}

function explorer (PORTS) {
  const script = `;(async (PORTS) => {
    const name = 'datdot-explorer'
    const connections = []
    const id = setTimeout(() => { start(console.log.bind(console)) }, 5000)
    window.start = start
    function start (logger) {
      window.start = void 0
      window.logger = logger
      clearTimeout(id)
      for (var i = 0, len = PORTS.length; i < len; i++) connect(PORTS[i])
      function connect (port) {
        const ws = new WebSocket('ws://localhost:' + port)
        connections.push({ ws, port, codec: { encode, decode } })
        logger.connections = connections
        var counter = 0
        function decode (json) { return json }
        function encode (type, body, cite) {
          const flow = [name, port, counter++]
          const message = { flow, cite, type, body }
          return JSON.stringify(message)
        }
        ws.onmessage = json => {
          const message = decode(json)
          const { flow, type, body } = message
          const [name, id] = flow || []
          logger(message)
        }
        ws.onopen = function open () {
          const message = encode('all:live')
          ws.send(message)
        }
        ws.onclose = function close () {
          const message = encode('close', 'unexpected closing of log server connection for: ' + port)
          logger(message)
        }
        ws.onerror = function error (err) {
          const message = encode('error', err)
          logger(message) // setTimeout(() => , 2000)
        }
      }
    }
  })([${PORTS.join(',')}])`
  const explorer = `
  <!doctype html>
  <html>
    <head>
      <meta charset="utf-8">
      <link rel="icon" type="image/png" sizes="16x16" href="data:image/png;base64,
  iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAMFBMVEU0OkArMjhobHEoPUPFEBIu
  O0L+AAC2FBZ2JyuNICOfGx7xAwTjCAlCNTvVDA1aLzQ3COjMAAAAVUlEQVQI12NgwAaCDSA0888G
  CItjn0szWGBJTVoGSCjWs8TleQCQYV95evdxkFT8Kpe0PLDi5WfKd4LUsN5zS1sKFolt8bwAZrCa
  GqNYJAgFDEpQAAAzmxafI4vZWwAAAABJRU5ErkJggg==" />
    </head>
    <body><script>${script}</script></body>
  </html>`
  return explorer
}
