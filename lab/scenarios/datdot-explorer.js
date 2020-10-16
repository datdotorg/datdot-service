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
function show (LOG) {
  document.body.innerHTML = ''
  const parser = document.createElement('div')
  document.body.innerHTML = `
  <div class="log"></div>
  <div class="status">${showStatus(LOG)}</div>
  <style>
    body { margin: 0; }
    .log { height: 85vh; background-color: #000; color: #ccc; display: flex; flex-direction: column; overflow-y: scroll; }
    .status { width: 100vw; height: 100vh; background-color: #000; }
    .item { padding: 5px 12px; font-family: arial; display:flex; flex-direction: row; }
    .name { font-size: 14px; min-width: 250px; }
    .message { font-size: 14px; word-break: break-word; }
  </style>`
  const [log, status] = document.body.children
  const nums = []
  const names = {}
  LOG.sort((a, b) => a[2] - b[2])
  for (var i = 0, len = LOG.length; i < len; i++) {
    const [name, id, time, message] = LOG[i]
    const stamp = `${time}`.split('.')[0]
    const color = () => {
      return names[name] || (names[name] = getRandomColor())
    }
    parser.innerHTML = `<div class="item" style="background-color: ${ i%2 ? '#282828' : '#202020'};">
      <div class="name" style="color: ${color()};">
        <span>${name}</span> <span style="font-size: 9px">(${id})</span>
      </div>
      <div class="message">${format(message)}</div>
    </div>`
    const [element] = parser.children
    log.append(element)
  }
  log.scrollTop = log.scrollHeight
  function getRandomColor () {
    var num = Math.random() * 360
    for (var i = 0; i < nums.length; i++) if (Math.abs(nums[i] - num) < 30) num = Math.random() * 360
    nums.push(num)
    return `hsla(${num}, 100%, 70%, 1)`
  }
  function format (message) {
    if (message && typeof message === 'object') {
      const [{ type, body }] = message
      if (type === 'error') return `<span style="color: red">${body}</span>`
      if (type === 'chainEvent') return `<span style="color: orange">${body}</span>`
      if (type === 'chain') return `<span style="color: white">${body}</span>`
      if (type === 'user') return `<span style="color: maroon">${body}</span>`
      if (type === 'peer') return `<span style="color: blue">${body}</span>`
      if (type === 'publisher') return `<span style="color: purple">${body}</span>`
      if (type === 'sponsor') return `<span style="color: lime">${body}</span>`
      if (type === 'author') return `<span style="color: fuchsia">${body}</span>`
      if (type === 'hoster') return `<span style="color: pink">${body}</span>`
      if (type === 'attestor') return `<span style="color: olive">${body}</span>`
      if (type === 'encoder') return `<span style="color: turquoise">${body}</span>`
      if (type === 'serviceAPI') return `<span style="color: teal"> ${body}</span>`
      if (type === 'chat') return `<span style="color: silver"> ${body}</span>`
      if (type === 'p2plex') return `<span style="color: SlateBlue"> ${body}</span>`
      if (type === 'chainAPI') return `<span style="color: white"> ${body}</span>`
      if (type === 'requestResponse') return `<span style="color: aqua"> ${body}</span>`
      if (type === 'feed') return `<span style="color: salmon"> ${body}</span>`
      if (type === 'log') return `<span style="color: gray">${body}</span>`
      if (Array.isArray(message)) return message.reduce((all, x) => all + `<span style="color: gray">${x}</span>`, '')
      return console.log('error', message)
    } else {
      return message
    }
  }
  function showStatus (LOG) {
    return `<div style="color: gray; padding: 10px 40px;"> STATUS
        <div> event NewContract: ${isLog('Event received: NewContract')}/7</div>
        <div> Connections made: ${isLog('Got a peer')}/18</div>
        <div> Encoding job done: ${isLog('confirmations received from the attestor')}/3</div>
        <div> Hosting job done: ${isLog('Hoster received & stored all')}/3</div>
        <div> event HostingStarted: ${isLog('Event received: HostingStarted')}/3</div>
        <div> Requesting Storage challenge: ${isLog('Requesting new StorageChallenge')}</div>
        <div> Requesting Performance challenge: ${isLog('Requesting new PerformanceChallenge')}</div>
        <div> event NewStorageChallenge: ${isLog('Event received: NewStorageChallenge')}/6</div>
        <div> event NewPerformanceChallenge: ${isLog('Event received: NewPerformanceChallenge')}/15</div>
        <div> event StorageChallengeConfirmed: ${isLog('Event received: StorageChallengeConfirmed')}/3</div>
        <div> event PerformanceChallengeConfirmed: ${isLog('Event received: PerformanceChallengeConfirmed')}/15</div>
        <div></div>
      </div>`

      function isLog (phrase) {
        const results = []
        for (var i = 0; i < LOG.length; i ++) {
          const body = LOG[i][3][0].body[0]
          if (body && body.includes(phrase)) results.push(LOG)
        }
        return results.length
      }
  }
}
function explorer (PORTS) {
  const script = `;(async (PORTS) => {
    window.PORTS = PORTS
    const name = 'datdot-explorer'
    start()
    function start () {
      window.connections = {}
      window.LOG = []
      function logger (port, message) {
        const msgs = connections[port].msgs
        const { flow: [from, into, id, time], type, body } = message

        if (type !== 'log') return console.error('unknown message type', message)
        if (!from) return console.error('missing sender', message)
        if (!into) return console.error('missing recipient', message)

        const path = \`\${from\}:\${into\}\${id\}\`
        if (msgs[path]) return console.error('duplicate message', message)
        msgs[path] = message

        LOG.push([from, id, time, body])
      }
      for (var i = 0, len = PORTS.length; i < len; i++) connect(PORTS[i])
      function connect (port) {
        const url = 'ws://localhost:' + port
        console.log('connecting and fetching logs from:', url)
        const ws = new WebSocket(url)
        connections[port] = { ws, port, codec: { encode, decode }, msgs: {} }
        var counter = 0
        function decode (json) { return JSON.parse(json) }
        function encode (type, body, cite) {
          const flow = [name, port, counter++]
          const message = { flow, cite, type, body }
          return JSON.stringify(message)
        }
        ws.onmessage = event => {
          const message = decode(event.data)
          logger(port, message)
        }
        ws.onopen = function open () {
          const message = encode('all:live')
          ws.send(message)
        }
        ws.onclose = function close () {
          const message = encode('close', 'unexpected closing of log server connection for: ' + port)
          console.error(message)
        }
        ws.onerror = function error (err) {
          const message = encode('error', err)
          console.error(message) // setTimeout(() => , 2000)
        }
      }
    }
    window.show = ${show}
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
