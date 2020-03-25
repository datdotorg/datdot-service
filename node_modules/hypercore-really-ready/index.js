module.exports = reallyReady

function reallyReady (feed, cb) {
  const promise = new Promise(function (resolve, reject) {
    function onupdate (err, result) {
      if (err && err.message !== 'No update available from peers') reject(err)
      else resolve()
    }

    feed.ready(function () {
if (feed.writable) resolve()
      if (feed.peers.length) {
        feed.update({ ifAvailable: true }, onupdate)
      } else {
        feed.once('peer-add', function () {
          feed.update({ ifAvailable: true }, onupdate)
        })
      }
    })
  })

  if (cb) {
    promise.then(() => setTimeout(cb, 0), (e) => setTimeout(() => cb(e), 0))
  }

  return promise
}
