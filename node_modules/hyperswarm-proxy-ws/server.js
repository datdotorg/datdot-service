const HyperswarmProxyServer = require('hyperswarm-proxy/server')
const websocket = require('websocket-stream')
const http = require('http')

class HyperswarmProxyWSServer extends HyperswarmProxyServer {
  constructor (opts = {}) {
    super(opts)
    const { server } = opts
    if (server) this.listenOnServer(server)
  }

  listenOnServer (server) {
    this.server = server
    this.websocketServer = websocket.createServer({ server }, (socket) => {
      this.handleStream(socket)
    })
  }

  listen (...args) {
    const server = http.createServer()
    this.listenOnServer(server)
    server.listen(...args)
  }

  destroy (cb) {
    // Closing the server rather than the websocket server actually closes the handles. 🤯
    this.server.close(() => {
      super.destroy(cb)
    })
  }
}

module.exports = HyperswarmProxyWSServer
