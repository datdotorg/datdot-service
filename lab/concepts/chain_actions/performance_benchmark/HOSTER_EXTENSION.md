# HOSTER EXTENSION
```js
function hosting_extension (feed, { onmessage, onerror }) {
  // https://www.npmjs.com/package/abstract-extension
  // https://github.com/hypercore-protocol/hypercore/blob/master/index.js
  // https://github.com/hypercore-protocol/hypercore/blob/master/lib/replicate.js#L758
  const name = 'hosting-extension'
  const handlers = {
    encoding: 'json' // | 'binary' | 'utf-8' | anyAbstractEncoding,
    onmessage,
    onerror
  }
  // Register a new replication extension. name should be the name of your extension and handlers should look like this:
  const ext = feed.registerExtension(name, handlers)
  return ext
}
```
-------------------------------------------------------------------------------
# HOSTER
```js
function offer_hosting (feed) {
  const ext = hosting_extension(feed)
  // feed.on('peer-add', peer) // Emitted when a peer is added.
  // feed.on('peer-remove', peer) // Emitted when a peer is removed.
  feed.on('peer-open', peer => { // Emitted when a peer channel has been fully opened.
    const message = initial_hoster_message()
    ext.send(message, peer)
    // Send an extension message to a specific peer.
  })
}
```

// check REGISTRATION FORM `registrationForm.js`
-------------------------------------------------------------------------------
# ATTESTOR
```js
const hosting_extension = require('hosting-extension')
const get_and_make_feed = require('get-and-make-feed')

on('provide-performance-benchmark', async function (event) {
  if (is_not_for_me(event)) return
  var done
  const { signal, abort } = new AbortController()
  const id_pop = setTimeout(abort, 5000)
  try {
    const data = await execute_benchmark(event, signal)
    submit_benchmark({ event, data })
  } catch (error) {
    submit_benchmark({ event, error })
  }
  function submit_benchmark (result) {
    if (done) return
    done = true
    clearTimeout(id_pop)
    chain.performance_benchmark_response(make_rating(event, result))    
  }
})

function make_rating (event, { error, data }) {
  if (error) {
    if (error.message === 'timeout: default benchmark') {
      // submit default rating
      return {}
    } else {
      // submit other error rating
      return {}
    }
  } else {
    // submit normal rating
    return {}
  }
}

async function execute_benchmark (event, signal) {
  return new Promise((resolve, reject) => {
    signal.onabort(() => reject(new Error('timeout: default benchmark')))
    const feed = await make_and_get_feed(event) // announce
    // feed.on('peer-add', peer) // Emitted when a peer is added.
    feed.on('peer-add', peer => {
      // ...
      peer.destroy()
      // @TODO: maybe observe request patterns for later re-use with hoster
    })
    // feed.on('peer-remove', peer) // Emitted when a peer is removed.
    feed.on('peer-open', peer => { // Emitted when a peer channel has been fully opened.
      peer.destroy()
      // @TODO: maybe observe request patterns for later re-use with hoster
    })
    const ext = hosting_extension(feed, {
      onmessage (message, peer) {
        const hoster = peer
        // called when a message is received from a peer
        // will be decoded using the encoding you provide

        feed.on('update', onupdate)
        function onupdate (index, data) { } // Emitted when a data block is going to be uploaded.
        feed.on('append', onappend)
        function onappend () { } // Emitted when the feed has been appended to (i.e. has a new length / byteLength).
        feed.on('download', ondownload)
        function ondownload (index, data) {} // Emitted when a data block has been downloaded.
        feed.on('upload', onupload)
        function onupload (index, value, peer) { }


        // => report results to the chain after continuing successfully
      },
      onerror (err) {
        // called in case of an decoding error

        // => report encoding error to the chain
      }
    })
  })
}
//////////////////////////////////////////////////////////////////
// RESEARCH
//////////////////////////////////////////////////////////////////
function Feed (opts) {
  // stats for feed (=total of all valid blocks from all peers)
  feed._stats = (typeof opts.stats !== 'undefined' && !opts.stats) ? null : {
    downloadedBlocks: 0,
    downloadedBytes: 0,
    uploadedBlocks: 0,
    uploadedBytes: 0
  }
  feed.peers = []
  return feed
}
const feed = Feed()
const peer1 = Peer({ feed })
const peer2 = Peer({ feed })
console.log(peer1.stats)
console.log(peer1.feed._stats)
function Peer ({ feed }) {
  const peer = { ondata, onrequest, send }
  feed.peers.push(peer)
  peer.feed = feed
  peer.stats = { // stats for Peer
    uploadedBytes: 0,
    uploadedBlocks: 0,
    downloadedBytes: 0,
    downloadedBlocks: 0
  }
  return peer
}
function onrequest (request) {
  peer.stats.uploadedBlocks += 1
  peer.stats.uploadedBytes += value.length
  peer.feed._stats.uploadedBlocks += 1
  peer.feed._stats.uploadedBytes += value.length
  peer.feed.emit('upload', request.index, value, self)
}
function ondata (data) {
  peer.feed._putBuffer(data.index, data.value, data, this, done)
  // Feed.prototype.put = function (index, data, proof, cb) {
  //    // https://github.com/hypercore-protocol/hypercore/blob/101837d3aac2f64f368dc9612d799e55960695b0/index.js#L780
  //    // =>_putBuffer
  //    //   => _verifyAndWrite
  //    //     => _write
  //    //     => _verifyRootsAndWrite
  //    //       => _write
  //    //         => _writeAfterHook
  //    //           => _writeDone
    peer.feed._stats.downloadedBlocks += 1
    peer.feed._stats.downloadedBytes += data.length
    peer.feed.emit('download', index, data, from)
  // }
  function done (err) {
    peer.stats.downloadedBlocks += 1
    peer.stats.downloadedBytes += data.value.length
  }
}
//////////////////////////////////////////////////////////////////
// IMPLEMENTATION
//////////////////////////////////////////////////////////////////
async function getFeedStats (feed) {
  // const latency = { lag, guarantee }
  // const performance = { availability, bandwidth, latency }
  // const performances = [{ // OPTIONAL
  //   availability: '', // percentage_decimal
  //   bandwidth: { /*'speed', 'guarantee'*/ }, // bitspersecond, percentage_decimal
  //   latency: { /*'lag', 'guarantee'*/ }, // milliseconds, percentage_decimal
  // }],
  // const availability = BASIC_TYPES.percentage_decimal
  // const speed = BASIC_TYPES.bitspersecond
  // const guarantee = BASIC_TYPES.percentage_decimal
  const others = {
    latency: await (async (timeout, delay) => {
      const t1 = performance.now()
      await Promise.race([feed.get(index),new Promise(delay)])
      return performance.now() - t1
    })(5000, (_,ko) => setTimeout(ko,timeout)).catch(e=>{}),
    bandwidth: {
      ingress, // input per second
      egress,  // output per second
    },
    traffic: {
      var speed = speedometer()
      stream.on('data', function(data) {
        var bytesPerSecond = speed(data.length) // amount of bytes transferred
        console.log(bytesPerSecond+' bytes/second')
      })
    }
  }
  const stats = {
    totals: {
      uploadedBytes: 100,
      uploadedBlocks: 1,
      downloadedBytes: 0,
      downloadedBlocks: 0
    },
    peers: [{
      uploadedBytes: 100,
      uploadedBlocks: 1,
      downloadedBytes: 0,
      downloadedBlocks: 0
    }]
  }


  feed.update([minLength], [callback])
  // Wait for the feed to contain at least minLength elements. If you do not provide minLength it will be set to current length + 1.
  // Does not download any data from peers except for a proof of the new feed length.
  console.log('length is', feed.length)
  feed.update(function () {
    console.log('length has increased', feed.length)
  })
  feed.length
  // How many blocks of data are available on this feed?
  // Populated after ready has been emitted. Will be 0 before the event.
  feed.byteLength
  // How much data is available on this feed in bytes?
  // Populated after ready has been emitted. Will be 0 before the event.


  const feedStats = {
    uploadedBytes: feed._stats.uploadedBytes,
    uploadedChunks: feed._stats.uploadedBlocks,
    downloadedBytes: feed._stats.downloadedBytes,
    downloadedChunks: feed.downloaded(),

    Feed.prototype.downloaded = function (start, end) {
      const count = this.bitfield.total(start, end)
      return count
    }

    totalBlocks: feed.length,
    peerStats: (() => {
      if (!this._stats) return null
      var peerStats = []
      for (var i = 0; i < this.peers.length; i++) {
        var peer = this.peers[i]
        peerStats[i] = peer._stats // !== feed._stats
      }
      return peerStats
    }),
    networkingStats:{
      key: feed.key,
      discoveryKey: feed.discoveryKey,
      peerCount: feed.peers.length,
      peers: feed.peers.filter(p => p.remoteOpened).map(p => {
        return { ...p.stats, remoteAddress: p.remoteAddress }
      })
    },
  }
}

  async checkPerformance (key, index) { // key = feedkey, index = chunk index
    return new Promise(async (resolve, reject) => {
      const feed = this.Hypercore(key, { persist: false })
      try {
        const start = performance.now()
        await Promise.race([
          feed.get(index),
          delay(this.timeout).then(() => { throw new Error('Timed out') })
        ])
        const end = performance.now()
        const latency = end - start
        const stats = await getFeedStats(feed)
        resolve([stats, latency])
      } catch (e) {
        this.log(`Error: ${key}@${index} ${e.message}`)
        reject()
        return [null, null]
      } finally {
        await feed.close()
      }

      async function getFeedStats (feed) {
        if (!feed) return {}
        const stats = feed.stats
        const openedPeers = feed.peers.filter(p => p.remoteOpened)
        const networkingStats = {
          key: feed.key,
          discoveryKey: feed.discoveryKey,
          peerCount: feed.peers.length,
          peers: openedPeers.map(p => {
            return { ...p.stats, remoteAddress: p.remoteAddress }
          })
        }
        return {
          ...networkingStats,
          uploadedBytes: stats.totals.uploadedBytes,
          uploadedChunks: stats.totals.uploadedBlocks,
          downloadedBytes: stats.totals.downloadedBytes,
          downloadedChunks: feed.downloaded(),
          totalBlocks: feed.length
        }
      }
    })
  }
///////////////////////////////////////////////////////////////////////
```
-------------------------------------------------------------------------------
# CHAIN
```js
async function performance_benchmark_response (rating) {
  console.log(rating)
  // 1. availability/reliability is calculated
  // 2.
  // ...


  //
  // ... ... ...
  // ...
}
function _doesQualify (roleID) {
  var bool
  // ...

  // ...
  return bool
}
```
