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

  async encodeFor (hosterKey, feedKey, ranges) {
    const feed = this.Hypercore(feedKey)

    // TODO: Add timeout for when we can't find the hoster
    const peer = await this.communication.findPeer(hosterKey)
    const efeed = new Hypercore(ram)

    // const ranges = [[2, 5], [7, 15], [17, 27]]
    for (range in ranges) {
      for (var i = range[0], var len = range[1] + 1; i < len; i++) {

        // TODO: Add timeout for when we can't get feed data
        const data = await feed.get(index)

        const encoded = await this.EncoderDecoder.encode(data)

        // TODO: Drive proof somehow? Maybe we need to sign it?
        const proof = Buffer.from('I swear this is legit')
        // getIdentity function

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
        // --------------------------------------------------------------
        efeed.append(encoded) // efeed.length === 21

        // @TODO: disconnect once synced + delete efeed + delete chunks from
        // original feed as soon as they have downloaded by the hoster
        var hosterswarm = new Hyperswarm()
        hosterswarm.join(hosterKey)
        hostterswarm.on('connection', (socket, info) => {
          socket.pipe(efeed.replicate(info.client)).pipe(socket)
        })




      }
    }



    // --------------------------------------------------------------
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
