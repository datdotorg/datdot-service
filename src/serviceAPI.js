const debug = require('debug')

module.exports = datdotService

function datdotService () {
  const FILE = __filename.split('/').pop().split('.')[0].toLowerCase()
  const log = debug(`${FILE}]`)

  const serviceAPI = {
    host,
    encode,
    verifyEncoding,
    getStorageChallenge,
    sendStorageChallengeToAttestor,
    verifyStorageChallenge,
    attest,
  }
  return serviceAPI

  /******************************************************************************
    API FUNCTIONS
  ******************************************************************************/

/* ----------------------------------------------------------------
               BEFORE HOSTING => ENCODING, VERIFYING, STORING
------------------------------------------------------------------ */
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

  function host (data) {
    const {account, feedKey, attestorKey, plan} = data
    log('start hosting')
    return account.hoster.addFeed({feedKey, attestorKey, plan})
  }

  /* ----------------------------------------------------------------
                     WHILE HOSTING => PROOFS
------------------------------------------------------------------ */
  async function getStorageChallenge ({ account, storageChallenge, feedKey }) {
    const data = await Promise.all(storageChallenge.chunks.map(async (chunk) => {
      return await account.hoster.getStorageChallenge(feedKey, chunk)
    }))
    return data
  }

  async function sendStorageChallengeToAttestor (data) {
    const { account, storageChallengeID, feedKey, attestorKey, proofs } = data
    await account.hoster.sendStorageChallenge({storageChallengeID, feedKey, attestorKey, proofs})
    // hoster sends proof of data to the attestor
  }

  async function verifyStorageChallenge (data) {
    const {account, hosterKey, feedKey, storageChallengeID} = data
    return await account.attestor.verifyStorageChallenge({storageChallengeID, feedKey, hosterKey})
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
    const { feed, index, encoded, proof, nodes, signature } = msg
    if (messages[index]) messages[index].push({ msg, cb })
    else messages[index] = [ { msg, cb } ]
    if (messages[index].length === 3) {
      const encodedBuffer = Buffer.from(encoded)
      const sizes = messages[index].map(message => encodedBuffer.length)
      // const sizes = [12,13,13] => test usecase for when chunk sizes not same
      const allEqual = sizes.every((val, i, arr) => val === arr[0])
      if (allEqual === true) messages[index].forEach(chunk => chunk.cb(null, msg))
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
