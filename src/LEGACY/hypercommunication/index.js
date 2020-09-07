const EventEmitter = require('events')
const EXTENSION_NAME = 'direct-communication'
const EXTENSION_ENCODING = 'json'

module.exports = class HyperCommunicaion extends EventEmitter {
  static async create (opts) {
    const communication = new HyperCommunicaion(opts)

    await communication.init()

    return communication
  }

  constructor ({
    sdk,
    extension = EXTENSION_NAME,
    encoding = EXTENSION_ENCODING
  } = {}) {
    super()
    this.sdk = sdk
    this.trackedFeeds = new Set()
    this.extension = extension
    this.peers = new WeakMap()
    this.encoding = encoding
  }

  async init () {
    const { publicKey } = await this.sdk.getIdentity()
    this.publicKey = publicKey
    this.ownChannel = this.sdk.Hypercore(this.publicKey)

    await this.ownChannel.ready()

    this.listenOwnChannel()
  }

  listenOwnChannel () {
    const feed = this.ownChannel
    this.trackedFeeds.add(feed)

    // Listen on incoming extension messages from peers trying to talk to us
    // Emit an event and make it easy to respond to them
    const extension = feed.registerExtension(this.extension, {
      encoding: this.encoding,
      onmessage: (message, peer) => this.handleMessage(message, peer, extension),
      onerror: (err) => this.emit('error', err)
    })
  }

  async findPeer (publicKey) {
    // Init hypercore
    const feed = this.sdk.Hypercore(publicKey)

    await feed.ready()

    // Look at existing peers and see if they have the same public key
    for (const peer of feed.peers) {
      const remoteId = getPeerPublicKey(peer)
      if (!remoteId) continue
      if (publicKey.equals(remoteId)) return this.prepareRemotePeer(feed, peer)
      // Disconnect any peers that aren't the owner of the key
      else peer.stream.end()
    }

    // Else listen on `peer-open` events and wait for the key
    return new Promise((resolve) => {
      const checkPeer = (peer, remoteId) => {
        if (publicKey.equals(remoteId)) {
          resolve(this.prepareRemotePeer(feed, peer))
          feed.removeListener('peer-open', handlePeer)
        } else peer.stream.end()
      }
      const handlePeer = (peer) => {
        const remoteId = getPeerPublicKey(peer)
        if (!remoteId) peer.stream.end()
        else checkPeer(peer, remoteId)
      }
      feed.on('peer-open', handlePeer)
    })
  }

  handleMessage (message, rawPeer, extension) {
    const peer = this.prepareRemotePeer(this.ownChannel, rawPeer, extension)

    this.emit('message', message, peer, extension)
  }

  prepareRemotePeer (feed, peer, extension) {
    // If we've seen this peer before, use them
    if (this.peers.has(peer)) {
      return this.peers.get(peer)
    }

    const prepared = new RemotePeer(extension || this.extension, this.encoding, feed, peer)

    this.peers.set(peer, prepared)

    return prepared
  }
}

class RemotePeer extends EventEmitter {
  constructor (extension, encoding, feed, peer) {
    super()

    this.publicKey = getPeerPublicKey(peer)

    // This is kinda messy, but whatever
    if (typeof extension === 'string') {
      const ext = feed.registerExtension(extension, {
        encoding,
        onmessage: (message, fromPeer) => {
        // Ignore messages from other peers
          if (fromPeer !== peer) return
          this.emit('message', message, this, ext)
        },
        onerror: (err) => this.emit('error', err)
      })
      this.ext = ext
    } else {
      this.ext = extension
    }

    this.peer = peer

    this.peer.stream.stream.once('close', () => this.emit('close'))
  }

  send (message) {
    this.ext.send(message, this.peer)
  }

  close () {
    this.peer.stream.stream.end()
  }
}

function getPeerPublicKey (peer) {
  return peer.stream.state.remotePublicKey
}
