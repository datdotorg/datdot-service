module.exports = datdotService

function datdotService (profile) {
  const log = profile.log.sub('service')

  const serviceAPI = {
    host,
    encode,
    verifyEncoding,
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
    log({ type: 'serviceAPI', body: [`Encode!`] })
    return account.encoder.encodeFor(amendmentID, attestorKey, encoderKey, feedKeyBuffer, ranges)
  }

  async function verifyEncoding (data) {
    const { account, amendmentID, feedKey, hosterKeys, attestorKey, encoderKeys } = data
    const messages = []
    const responses = []
    for (var i = 0, len = encoderKeys.length; i < len; i++) {
      const encoderKey = encoderKeys[i]
      const hosterKey = hosterKeys[i]
      const opts = { amendmentID, attestorKey, encoderKey, hosterKey, feedKey, cb: (msg, cb) => compareEncodings(messages, msg, cb) }
      log({ type: 'serviceAPI', body: [`Verify encodings!`] })
      responses.push(account.attestor.verifyEncodingFor(opts))
    }
    return Promise.all(responses)
  }

  async function host (data) {
    const { account, amendmentID, feedKey, hosterKey, attestorKey, plan } = data
    const opts = { amendmentID, feedKey, hosterKey, attestorKey, plan }
    log({ type: 'serviceAPI', body: [`Host! ${JSON.stringify(opts)}`] })

    return await account.hoster.hostFor(opts)
  }

  async function removeFeed ({ feedKey, account }) {
    const hasKey = await account.hoster.hasKey(feedKey)
    log({ type: 'serviceAPI', body: [`DropHosting hasKey? ${hasKey}`] })
    // @TODO fix errors in hoster storage when trying to remove feed
    // if (hasKey) return await account.hoster.removeFeed(feedKey)
    // @TODO ELSE => cancelHostFor process (disconnect from attestor and removeKey) <= for hosters that didn't start hosting on time
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
    log({ type: 'serviceAPI', body: [`send storage to attestor!`] })
    return account.hoster.sendStorageChallenge({ storageChallenge, hosterKey, feedKey, attestorKey })
  }

  async function verifyStorageChallenge (data) {
    const { account, attestorKey, hosterKey, feedKey, storageChallenge } = data
    log({ type: 'serviceAPI', body: [`verify storage!`] })
    // @TODO prepare the response: hash, proof etc. instead of sending the full chunk
    return await account.attestor.verifyStorageChallenge({ storageChallenge, attestorKey, feedKey, hosterKey })
  }

  async function checkPerformance (data) {
    const { account, randomChunks, feedKey } = data
    log({ type: 'serviceAPI', body: [`check performance!`] })
    const report = await Promise.all(randomChunks.map(async (chunk) => {
      return await account.attestor.checkPerformance(feedKey, chunk)
    }))
    return report
  }

  /******************************************************************************
    HELPER FUNCTIONS
  ******************************************************************************/

  function compareEncodings (messages, msg, cb) {
    const { index } = msg
    // get all three chunks from different encoders, compare and then respond to each
    log({ type: 'serviceAPI', body: [`comparing encoding for index: ${index} (${messages[index] ? messages[index].length : 'none'}/3)`] })

    if (messages[index]) messages[index].push({ msg, cb })
    else messages[index] = [{ msg, cb }]
    if (messages[index].length === 3) {
      log({ type: 'serviceAPI', body: [`Have 3 encodings, comparing them now!`] })

      const sizes = messages[index].map(message => {
        return Buffer.from(message.msg.encoded).length
      })
      // const sizes = [12,13,13] // => test usecase for when chunk sizes not same
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
        const err = 'Encoding denied'
        if (a !== b) {
          if (a < b) {
            smallest = a
            cb(err, messages[k])
          } else {
            smallest = b
            cb(err, messages[i])
          }
        }
      }
    }
  }
}
