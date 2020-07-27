const debug = require('debug')

module.exports = datdotService

function datdotService () {
  const NAME = __filename.split('/').pop().split('.')[0].toLowerCase()
  const log = debug(`${NAME}]`)

  const serviceAPI = {
    host,
    encode,
    verifyEncoding,
    getProofOfStorage,
    attest,
  }
  return serviceAPI

  function host (data) {
    const {account, feedKey , encoderKey, plan} = data
    log('start hosting')
    return account.hoster.addFeed({feedKey, encoderKey, plan})
  }

  function encode (data) {
    const { account, hosterKey, attestorKey, feedKey: feedKeyBuffer, ranges } = data
    log('start encoding')
    return account.encoder.encodeFor(hosterKey, attestorKey, feedKeyBuffer, ranges)
  }

  async function verifyEncoding (data) {
    const {account, encoderKeys, feedKey} = data
    const msgs = []
    encoderKeys.forEach(async (encoderKey) => {
      await account.attestor.listenEncoder(encoderKey, feedKey, (msg, cb) => {
        if (msgs[msg.index]) msgs[msg.index].push({ msg, cb })
        else msgs[msg.index] = [ { msg, cb } ]
        if (msgs[msg.index].length === 3) {
          const lengths = msgs[msg.index].map(message => msg.encoded.data.length)
          const allEqual = lengths.every((val, i, arr) => val === arr[0])
          if (allEqual === true) msgs[msg.index].forEach(chunk => chunk.cb(null, msg))
          else {
            // figure out which one is not ok
          }
        }
      })
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

}
