const WebSocket = require('ws')
const { performance } = require('perf_hooks')
const debug = require('debug')

const docs = {
  'all:live': `receive all log message and subscribe to future messages`
}

function codec (from, into, counter = 0) {
  function decode (json) { return JSON.parse(json) }
  function encode (type, body, cite) {
    const flow = [from, into, counter++, performance.now()]
    const message = { flow, cite, type, body }
    return JSON.stringify(message)
  }
  return { encode, decode }
}

var instance = void 0

module.exports = logkeeper

async function logkeeper (name, PORT) {
  PORT = Number(PORT)
  if (instance) throw new Error('logkeeper already initialized')
  if (typeof name !== 'string') throw new Error('invalid logger name')
  if (!Number.isInteger(PORT)) throw new Error('invalid logger port')
  return new Promise(connect)
  function connect (resolve, reject) {
    const LOG = debug(`logkeeper:${name}`)
    const connections = []
    const history = [] // @TODO: should be a persistent hypercore
    const loggers = {}
    var counter = 0 // message id counter
    instance = loggers[name] = makelog([name])
    function makelog (names) {
      const path = names.join('/')
      if (loggers[path]) {
        LOG(`warning: requesting logger "${path}" more than once`)
        return loggers[path]
      }
      const { encode, decode } = codec(path, '*')
      function log (...args) {
        if (args.length > 1 || args.length === 0 || (args.length === 1 && !args[0])) {
          console.log(name, args.length, args)
          throw new Error('invalid logs')
        }
        if (!args[0].type) {
          console.log(name, args[0])
          throw new Error('invalid type')
        }
        const message = encode('log', args)
        console.log('New logkeeper message: ${message}', args)
        history.push(message)
        for (var i = 0, len = connections.length; i < len; i++) {
          const client = connections[i]
          if (client) client.send(message)
        }
      }
      log.sub = subname => {
        if (!subname || typeof subname !== 'string') throw new Error('invalid logger name')
        return makelog(names.concat(subname))
      }
      return loggers[path] = log
    }
    const wss = new WebSocket.Server({ port: PORT }, after)
    function after () {
      LOG(`running on http://localhost:${wss.address().port}`)
    }
    resolve(instance)
    wss.on('connection', function connection (ws) {
      const index = connections.push(ws) - 1
      ws.on('message', function incoming (message) {
        message = JSON.parse(message)
        const { flow, type, body } = message
        const [from, into, id] = flow
        if (type === 'all:live') {
          LOG('send logs to client:', from)
          for (var i = 0, len = history.length; i < len; i++) ws.send(history[i])
        } else LOG('client sent unknown message', message)
      })
      ws.on('close', function close () {
        console.log('logkeeper close', name, PORT)
        connections[index] = undefined
        LOG(`client ${index} disconnected`)
      })
      ws.on('error', function error (err) {
        console.log('logkeeper error ', name, PORT)
        LOG(`ERROR: client ${index} disconnected`)
      })
    })
  }
}
