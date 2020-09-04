/******************************************************************************
  ROLE: Encoder
******************************************************************************/

module.exports = role

async function role (profile, APIS) {
  const { name, account, log } = profile
  const { serviceAPI, chainAPI, chatAPI } = APIS

  log('Register as encoder')
  await chainAPI.listenToEvents(handleEvent)
  await account.initEncoder({}, log)
  const encoderKey = account.encoder.publicKey
  const myAddress = account.chainKeypair.address
  const signer = account.chainKeypair
  const nonce = await account.getNonce()
  await chainAPI.registerEncoder({ encoderKey, signer, nonce })

  // EVENTS
  async function isForMe (peerids) {
    for (var i = 0, len = peerids.length; i < len; i++) {
      const id = peerids[i]
      const peerAddress = await chainAPI.getUserAddress(id)
      if (peerAddress === myAddress) return true
    }
  }
  async function handleEvent (event) {
    if (event.method === 'NewContract') {
      const [contractID] = event.data
      const contract = await chainAPI.getContractByID(contractID)
      const encoders = contract.encoders
      if (!await isForMe(encoders)) return
      console.log('=====[NEW CONTRACT]=====')
      log('Event received:', event.method, event.data.toString())
      const { attestorKey, feedKey, ranges } = await getHostingData(contract)
      await serviceAPI.encode({ contractID, account, attestorKey, encoderKey, feedKey, ranges })
      // const nonce = await account.getNonce()
      // await chainAPI.encodingDone({ contractID, signer, nonce })
    }
  }

  // HELPERS

  async function getHostingData (contract) {
    const ranges = contract.ranges
    const planID = contract.plan
    const feedID = contract.feed
    const feedKey = await chainAPI.getFeedKey(feedID)
    const attestorID = contract.attestor
    const attestorKey = await chainAPI.getAttestorKey(attestorID)
    return { attestorKey, feedKey, ranges }
  }
}
