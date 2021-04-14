module.exports = datdotService

function datdotService (profile) {
  const log = profile.log.sub('service')

  const serviceAPI = {
    host,
    encode,
    verifyAndForwardEncodings,
    // getStorageChallenge,
    removeFeed,
    sendStorageChallengeToAttestor,
    verifyStorageChallenge,
    checkPerformance
  }
  return serviceAPI

  /******************************************************************************
    API FUNCTIONS
  ******************************************************************************/

  /* ----------------------------------------------------------------
                 BEFORE HOSTING => ENCODING, VERIFYING, STORING
  ------------------------------------------------------------------ */
  async function encode ({ amendmentID, account, attestorKey, encoderKey, feedKey: feedKeyBuffer, ranges }) {
    log({ type: 'serviceAPI', data: [`Encode!`] })
    return account.encoder.encodeFor({ amendmentID, attestorKey, encoderKey, feedKeyBuffer, ranges })
  }

  async function verifyAndForwardEncodings (data/*, currentState, signal*/) {
    const { account, amendmentID, feedKey, hosterKeys, attestorKey, encoderKeys, ranges } = data
    const messages = {}
    const responses = []
    for (var i = 0, len = encoderKeys.length; i < len; i++) {
      const encoderKey = encoderKeys[i]
      const hosterKey = hosterKeys[i]
      const opts = { amendmentID, attestorKey, encoderKey, hosterKey, ranges, feedKey, compareCB: (msg, key) => compareEncodings({messages, key, msg}) }
      log({ type: 'serviceAPI', data: [`Verify encodings!`] })
      responses.push(account.attestor.hosting_setup(opts))
    }
    const failedKeys = await Promise.all(responses) // can be 0 to 6 pubKeys of failed providers
    return failedKeys.flat()
  }

  async function host (data) {
    const { account, amendmentID, feedKey, hosterKey, attestorKey, plan, ranges } = data
    const opts = { amendmentID, feedKey, hosterKey, attestorKey, plan, ranges }
    log({ type: 'serviceAPI', data: [`Host! ${JSON.stringify(opts)}`] })
    return await account.hoster.hostFor(opts)
  }

  async function removeFeed ({ feedKey, account }) {
    const hasKey = await account.hoster.hasKey(feedKey)
    log({ type: 'serviceAPI', data: [`DropHosting hasKey? ${hasKey}`] })
    // TODO fix errors in hoster storage when trying to remove feed
    if (hasKey) return await account.hoster.removeFeed(feedKey)
    // TODO ELSE => cancelHostFor process (disconnect from attestor and removeKey) <= for hosters that didn't start hosting on time
  }

  /* ----------------------------------------------------------------
                     WHILE HOSTING => proof
------------------------------------------------------------------ */
  // async function getStorageChallenge ({ account, storageChallenge, feedKey }) {
  //   const data = await Promise.all(storageChallenge.chunks.map(async (index) => {
  //     return await account.hoster.getStorageChallenge(feedKey, index)
  //   }))
  //   return data
  // }

  async function sendStorageChallengeToAttestor (data) {
    const { account, hosterKey, storageChallenge, feedKey, attestorKey } = data
    log({ type: 'serviceAPI', data: [`send storage to attestor!`] })
    return account.hoster.sendStorageChallenge({ storageChallenge, hosterKey, feedKey, attestorKey })
  }

  async function verifyStorageChallenge (data) {
    const { account, attestorKey, hosterKey, feedKey, storageChallenge } = data
    log({ type: 'serviceAPI', data: [`verify storage!`] })
    // TODO prepare the response: hash, proof etc. instead of sending the full chunk
    return await account.attestor.verifyStorageChallenge({ storageChallenge, attestorKey, feedKey, hosterKey })
  }

  async function checkPerformance (data) {
    const { account, randomChunks, feedKey } = data
    log({ type: 'serviceAPI', data: [`check performance!`] })
    const report = await Promise.all(randomChunks.map(async (chunk) => {
      return await account.attestor.checkPerformance(feedKey, chunk)
    }))
    return report
  }

  /******************************************************************************
    HELPER FUNCTIONS
  ******************************************************************************/

  async function compareEncodings ({messages, key, msg}) {
    return new Promise(async (resolve, reject) => {
      // get all three chunks from different encoders, compare and then respond to each
      const message = await msg
      const data = JSON.parse(message)
      const { index, encoded  } = data
      const size = Buffer.from(encoded).byteLength // TODO or .length
      if (messages[index]) messages[index].push({ key, size, resolve, reject })
      else messages[index] = [{ key, size, resolve, reject }]
      log({ type: 'serviceAPI', data: [`comparing encodings for index: ${index} => (${messages[index].length}/3)`] })
      if (messages[index].length === 3) {
        log({ type: 'serviceAPI', data: [`Have 3 encodings, comparing them now!`] })
        findInvalidEncoding(messages[index], (err, res) => {
          messages[index].forEach(item => {
            if (err) item.reject(err)
            if (res) item.resolve(res)
          })
        })
      }
    })
  }
  function findInvalidEncoding (messages, cb) {
    const failedEncoders = []
    var smallest = messages[0].size
    for (var i = 0, len = messages.length; i < len; i++) {
      for (var k = i + 1; k < len; k++) {
        const [a, b] = [messages[i].size, messages[k].size]
        if (a !== b) {
          if (a < b) {
            smallest = a
            failedEncoders.push(messages[k].key)
            cb({ type: 'invalid_encoding', key: failedEncoders })
          } else {
            smallest = b
            failedEncoders.push(messages[i].key)
            cb({ type: 'invalid_encoding', key: failedEncoders })
          }
        }
        else cb(null, { type: 'verified' })
      }
    }
  }
}
