
module.exports = function intercept (feed, { putData, getData }) {
  const storage = feed._storage
  const _putData = storage.putData
  const _getData = storage.getData

  storage.putData = function monkeyPutData (index, data, nodes, cb) {
    putData(index, data, cb)
  }

  storage.getData = function monkeyGetData (index, cb) {
    getData(index, cb)
  }

  function unintercept () {
    storage.putData = _putData
    storage.getData = _getData
  }

  return unintercept
}
