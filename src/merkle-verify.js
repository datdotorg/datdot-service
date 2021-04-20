module.exports = merkle_verify

async function merkle_verify () {
  return new Promise((resolve, reject) => {
    console.log('merkle verifying')
    feed.verify(index, signature, (err, res) => {
      console.log('Got a verify cb', err, res)
      return cb(err, res)
    })
  })
}