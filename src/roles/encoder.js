/******************************************************************************
  ROLE: Encoder
******************************************************************************/

module.exports = role

async function role (profile, APIS) {
  const { name, log } = profile
  const { serviceAPI, chainAPI, vaultAPI } = APIS

  log({ type: 'encoder', body: [`Register as encoder`] })
  await chainAPI.listenToEvents(handleEvent)
  await vaultAPI.initEncoder({}, log)
  const encoderKey = vaultAPI.encoder.publicKey
  const myAddress = vaultAPI.chainKeypair.address
  const signer = vaultAPI.chainKeypair
  const nonce = await vaultAPI.getNonce()
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
      log({ type: 'chainEvent', body: [`Event received: ${event.method} ${event.data.toString()}`] })
      const { attestorKey, feedKey, ranges } = await getHostingData(contract)
      const encoding = await serviceAPI.encode({ contractID, account: vaultAPI, attestorKey, encoderKey, feedKey, ranges }).catch((error) => log({ type: 'error', body: [`error: ${error}`] }))
      if (!encoding) { return log({ type: 'encoder', body: [`Encoding job could not be finished`] }) }
      log({ type: 'encoder', body: [`Encoding done`] })
      // const nonce = await vaultAPI.getNonce()
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
