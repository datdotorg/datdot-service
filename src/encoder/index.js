const { once } = require('events')

module.exports = class Encoder {
  constructor ({
    Hypercore,
    communication,
    EncoderDecoder
  }) {
    this.Hypercore = Hypercore
    this.communication = communication
    this.EncoderDecoder = EncoderDecoder
  }

  async encodeFor (hosterKey, feedKey, index) {
    const feed = this.Hypercore(feedKey)

    // TODO: Add timeout for when we can't get feed data
    const data = await feed.get(index)

    // TODO: Add timeout for when we can't find the hoster
    const peer = await this.communication.findPeer(hosterKey)

    const encoded = await this.EncoderDecoder.encode(data)

    // TODO: Drive proof somehow? Maybe we need to sign it?
    const proof = Buffer.from('I swear this is legit')

    // Send the encoded stuff over to the hoster so they can store it
    // TODO: Figure out why this timing is necessary.
    setTimeout(() => {
      peer.send({
        type: 'encoded',
        feed: feedKey,
        index,
        encoded,
        proof
      })
    }, 1000)

    // TODO: Set up timeout for when peer doesn't respond to us
    const [response] = await once(peer, 'message')

    peer.close()

    if (response.error) {
      throw new Error(response.error)
    }

    return {
      feedKey,
      index,
      hosterKey,
      encoded,
      proof,
      response
    }
  }
}
