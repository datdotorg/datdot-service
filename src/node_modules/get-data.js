module.exports = get_data

async function get_data (feed, index) {
  return new Promise((resolve, reject) => {
    feed.get(index, (err, res) => {
      if (err) reject(err)
      resolve(res)
    })
  })
}