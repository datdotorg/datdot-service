module.exports = get_nodes

async function get_nodes (feed, index) {
  return new Promise((resolve, reject) => {
    feed.rootHashes(index, (err, res) => {
      if (err) reject(err)
      resolve(res)
    })
  })
}