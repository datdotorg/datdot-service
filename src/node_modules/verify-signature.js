module.exports = verify_signature

async function verify_signature (feed, index) {
  return new Promise((resolve, reject) => {
    feed.verify(index, signature, (err, res) => {
      if (err) reject(err)
      resolve(res)
    })
  })
}