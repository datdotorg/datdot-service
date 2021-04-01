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
    return account.encoder.encodeFor(amendmentID, attestorKey, encoderKey, feedKeyBuffer, ranges)
  }

  async function verifyAndForwardEncodings (data/*, currentState, signal*/) {
    const { account, amendmentID, feedKey, hosterKeys, attestorKey, encoderKeys, ranges } = data
    const messages = {}
    const responses = []
    for (var i = 0, len = encoderKeys.length; i < len; i++) {
      const encoderKey = encoderKeys[i]
      const hosterKey = hosterKeys[i]
      const opts = { amendmentID, attestorKey, encoderKey, hosterKey, ranges, feedKey, compareCB: (msg, key, cb) => compareEncodings({messages, key, msg}, cb) }
      log({ type: 'serviceAPI', data: [`Verify encodings!`] })
      responses.push(account.attestor.verifyAndForwardFor(opts))
    }
    const failedKeys = await Promise.all(responses)
    return failedKeys
  }

  async function host (data) {
    const { account, amendmentID, feedKey, hosterKey, attestorKey, plan } = data
    const opts = { amendmentID, feedKey, hosterKey, attestorKey, plan }
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
  // FLOW:
  // // STEP 0: ATTESTOR
  // if (event.method === 'NewAmendment') {
  //   // ...
  //   const failed = await serviceAPI.verifyAndForwardEncodings(opts, signal)
  //   // ...
  //   const report = { id: amendmentID, failed }
  //   await chainAPI.amendmentReport({ report })
  // }
  //  // STEP 1
  //  async function verifyEncodings ({ account, amendmentID, feedKey, hosterKeys, attestorKey, encoderKeys, ranges }) {
  //    const messages = {}
  //    const responses = []
  //    for (var i = 0, len = encoderKeys.length; i < len; i++) {
  //      const encoderKey = encoderKeys[i]
  //      const hosterKey = hosterKeys[i]
  //      const opts = { /*...*/ compareCB: (msg, cb) => compareEncodings(messages, msg, cb) }
  //      responses.push(account.attestor.verifyEncodingFor(opts))
  //    }
  //    return await Promise.all(responses) // failedKeys
  //  }
  //  // STEP 2
  //  async verifyEncodingFor (opts) {
  //    // ...
  //    for await (const message of encoderComm.parse$) {
  //      //...
  //      verifiedAndStored.push(compareEncodingsPromise(message).catch(err => {  ...  }))
  //      //...
  //   }
  //   // ...
  // }
  // // STEP 3
  //  function compareEncodingsPromise (message) {
  //    return new Promise((resolve, reject) => {
  //      compareCB(message, async (err, res) => {
  //        if (!err) await sendToHoster(message, log2hoster)
  //        else reject(err)
  //      })
  //    })
  //  }
  //  // STEP 4

  function compareEncodings ({messages, key, msg}, cb) {
    const { index } = msg
    // get all three chunks from different encoders, compare and then respond to each
    log({ type: 'serviceAPI', data: [`comparing encoding for index: ${index} (${messages[index] ? messages[index].length : 'none'}/3)`] })

    const size = Buffer.from(msg.encoded).length // TODO or .bytelength
    if (messages[index]) messages[index].push({ key, size, cb })
    else messages[index] = [{ key, size, cb }]
    if (messages[index].length === 3) {
      log({ type: 'serviceAPI', data: [`Have 3 encodings, comparing them now!`] })
      findInvalidEncoding(messages)
    }
  }
  function findInvalidEncoding (messages) {
    const failedEncoders = []
    // const { key, size, cb } =
    var smallest = messages[0].size
    for (var i = 0, len = messages.length; i < len; i++) {
      for (var k = i + 1; k < len; k++) {
        const [a, b] = [messages[i].size, messages[k].size]
        if (a !== b) {
          if (a < b) {
            smallest = a
            failedEncoders.push(messages[k].key)
            const err = { type: 'Encoding failed', failedEncoders }
            cb(err)
          } else {
            smallest = b
            cb(err)
          }
        }
        else cb()
      }
    }
  }
}
