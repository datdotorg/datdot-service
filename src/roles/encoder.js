const registrationForm = require('../registrationForm')
/******************************************************************************
  ROLE: Encoder
******************************************************************************/

module.exports = role

async function role (profile, APIS) {
  const { name, log } = profile
  const { serviceAPI, chainAPI, vaultAPI } = APIS

  log({ type: 'encoder', body: [`Register as encoder`] })
  await vaultAPI.initEncoder({}, log)
  const encoderKey = vaultAPI.encoder.publicKey
  const myAddress = vaultAPI.chainKeypair.address
  log({ type: 'encoder', body: [`My address ${myAddress}`] })
  const signer = vaultAPI.chainKeypair
  const nonce = await vaultAPI.getNonce()
  const settings = { from: new Date(), until: '' }
  const form = registrationForm('encoder', settings)
  await chainAPI.registerEncoder({ form, encoderKey, signer, nonce })
  await chainAPI.listenToEvents(handleEvent)

  // EVENTS
  async function isForMe (encoders, event) {
    for (var i = 0, len = encoders.length; i < len; i++) {
      const id = encoders[i]
      const peerAddress = await chainAPI.getUserAddress(id)
      if (peerAddress === myAddress) {
        log({ type: 'chainEvent', body: [`Encoder ${id}:  Event received: ${event.method} ${event.data.toString()}`] })
        return true
      }
    }
  }
  async function handleEvent (event) {
    if (event.method === 'RegisteredForEncoding') {
      const [userID] = event.data
      const encoderAddress = await chainAPI.getUserAddress(userID)
      if (encoderAddress === myAddress) {
        log({ type: 'encoder', body: [`Event received: ${event.method} ${event.data.toString()}`] })
      }
    }
    if (event.method === 'NewContract') {
      const [contractID] = event.data
      const contract = await chainAPI.getContractByID(contractID)
      const encoders = contract.providers.encoders
      if (!await isForMe(encoders, event)) return
      // log({ type: 'chainEvent', body: [`Event received: ${event.method} ${event.data.toString()}`] })
      const { attestorKey, feedKey, ranges } = await getHostingData(contract)
      const data = { contractID, account: vaultAPI, attestorKey, encoderKey, feedKey, ranges }
      const encoding = await serviceAPI.encode(data).catch((error) => log({ type: 'error', body: [`error: ${error}`] }))
      if (!encoding) { return log({ type: 'encoder', body: [`Encoding job could not be finished`] }) }
      log({ type: 'encoder', body: [`Encoding done`] })
    }
  }

  // HELPERS

  async function getHostingData (contract) {
    const ranges = contract.ranges
    const planID = contract.plan
    const feedID = contract.feed
    const feedKey = await chainAPI.getFeedKey(feedID)
    const [attestorID] = contract.providers.attestors
    const attestorKey = await chainAPI.getAttestorKey(attestorID)
    return { attestorKey, feedKey, ranges }
  }
}
