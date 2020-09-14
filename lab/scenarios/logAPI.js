const WebSocket = require('ws')

var instance = void 0

module.exports = getLogAPI

async function getLogAPI (name, url) {
  if (instance) throw new Error('logger already initialized')
  if (typeof name !== 'string') throw new Error('invalid logger name')
  if (typeof url !== 'string') throw new Error('invalid log server url')
  return new Promise(connect)
  function connect (resolve, reject) {
    const ws = new WebSocket(url)
    const loggers = {}
    var counter = 0 // message id counter
    instance = loggers[name] = makelog([name])
    function makelog (names) {
      const path = names.join('/')
      if (loggers[path]) return loggers[path]
      function log (...args) {
        const flow = [path, counter++]
        // @TODO: save/buffer log messages and send to Server
        // also: get confirmation from server
        ws.send(JSON.stringify({ flow, type: 'log', body: args }))
      }
      log.sub = subname => {
        if (!subname || typeof subname !== 'string') throw new Error('invalid logger name')
        return makelog(names.concat(subname))
      }
      return loggers[path] = log
    }
    ws.on('message', json => {
      const message = JSON.parse(json)
      // @TODO: send log messages again if not yet sent
      console.log('message successfully sent to the logging server', message)
    })
    // {
    //   on: callback => ws.on('message', json => {
    //     const body = JSON.parse(json)
    //     log('received', body)
    //     callback(body)
    //   }),
    //   send: body => ws.send(JSON.stringify({
    //     flow: [name, counter++],
    //     type: 'say',
    //     body: body,
    //   })),
    // }
    ws.on('open', function open () {
      const flow = [name, counter++]
      ws.send(JSON.stringify({ flow, type: 'connect' }))
      resolve(instance)
    })
    ws.on('close', function close () {
      console.error('unexpected closing of log server connection for', name)
    })
    ws.on('error', function error (err) {
      // @TODO: maybe use incremental backoff strategy
      setTimeout(() => connect(resolve, reject), 2000)
    })
  }
}
