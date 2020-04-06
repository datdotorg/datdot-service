const HyperswarmProxyClient = require('hyperswarm-proxy/client')
const websocket = require('websocket-stream')

const DEFAULT_PORT = '4977' // HYPR on a cellphone keypad
const LOCAL_PROXY = `ws://localhost:${DEFAULT_PORT}`
const DEFAULT_PROXY = LOCAL_PROXY
const DEFAULT_RECONNECT_DELAY = 1000

class HyperswarmProxyWSClient extends HyperswarmProxyClient {
  constructor (opts = {}) {
    super(opts)

    const { proxy = DEFAULT_PROXY, reconnectDelay = DEFAULT_RECONNECT_DELAY } = opts

    this.proxy = proxy
    this.reconnectDelay = reconnectDelay

    this.reconnect()
  }

  reconnect () {
    const localSocket = websocket(LOCAL_PROXY)

    // Re-emit errors
    localSocket.on('error', (e) => this.emit('connection-error', e))

    localSocket.once('error', () => {
      // Couldn't connect to a local proxy
      // Attempt to connect to the internet proxy
      const proxySocket = websocket(this.proxy)

      // Re-emit errors
      proxySocket.on('error', (e) => this.emit('connection-error', e))

      proxySocket.once('close', () => {
        setTimeout(() => {
          if (this.destroyed) return
          this.reconnect()
        }, this.reconnectDelay)
      })

      super.reconnect(proxySocket)
    })
    super.reconnect(localSocket)
  }
}

module.exports = HyperswarmProxyWSClient
