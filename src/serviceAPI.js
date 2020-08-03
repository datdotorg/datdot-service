const debug = require('debug')

module.exports = datdotService

function datdotService () {
  const FILE = __filename.split('/').pop().split('.')[0].toLowerCase()
  const log = debug(`${FILE}]`)

  const serviceAPI = {
    host,
    encode,
    verifyEncoding,
    getProofOfStorage,
    attest,
  }
  return serviceAPI

  /******************************************************************************
    API FUNCTIONS
  ******************************************************************************/
  function host (data) {
    const {account, feedKey, attestorKey, plan} = data
    log('start hosting')
    return account.hoster.addFeed({feedKey, attestorKey, plan})
  }

  function encode (data) {
    const { account, hosterKey, attestorKey, feedKey: feedKeyBuffer, ranges } = data
    log('start encoding')
    return account.encoder.encodeFor(hosterKey, attestorKey, feedKeyBuffer, ranges)
  }

  async function verifyEncoding (data) {
    const {account, encoderKeys, hosterKeys, feedKey} = data
    const messages = []
    encoderKeys.forEach(async (encoderKey, i) => {
      const pos = i
      hosterKey = hosterKeys[pos]
      const opts = { encoderKey, hosterKey, feedKey, cb: (msg, cb) => compareEncodings(messages, msg, cb) }
      await account.attestor.verifyEncoding(opts)
    })
  }

  async function getProofOfStorage (data) {
    const { account, challenge, feedKey } = data
    const proof = await Promise.all(challenge.chunks.map(async (chunk) => {
      return await account.hoster.getProofOfStorage(feedKey, chunk)
    }))
    return proof
  }

  async function attest (data) {
    const { account, randomChunks, feedKey } = data
    console.log('start attesting')
    const report = await Promise.all(randomChunks.map(async (chunk) => {
      return await account.attestor.attest(feedKey, chunk)
    }))
    return report
  }

  /******************************************************************************
    HELPER FUNCTIONS
  ******************************************************************************/

  function compareEncodings (messages, msg, cb) {
    if (messages[msg.index]) messages[msg.index].push({ msg, cb })
    else messages[msg.index] = [ { msg, cb } ]
    if (messages[msg.index].length === 3) {
      const sizes = messages[msg.index].map(message => msg.encoded.data.length)
      // const sizes = [12,13,13] => test usecase for when chunk sizes not same
      const allEqual = sizes.every((val, i, arr) => val === arr[0])
      if (allEqual === true) messages[msg.index].forEach(chunk => chunk.cb(null, msg))
      else findInvalidEncoding(sizes, messages, cb)
    }
  }
  function findInvalidEncoding (sizes, messages, cb) {
    var smallest = sizes[0]
    for (var i = 0, len = sizes.length; i < len; i++) {
      for (var k = i + 1; k < len; k++) {
        const [a, b] = [sizes[i], sizes[k]]
        if (a !== b) {
          if (a < b) {
            smallest = a
            cb('Encoding denied', messages[k])
          } else {
            smallest = b
            cb('Encoding denied', messages[i])
          }
        }
      }
    }
  }

}
