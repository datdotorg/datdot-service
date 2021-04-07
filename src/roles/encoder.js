const registrationForm = require('../registrationForm')
const dateToBlockNumber = require('../dateToBlockNumber')
/******************************************************************************
  ROLE: Encoder
******************************************************************************/

module.exports = role

async function role (profile, APIS) {
  const { name, log } = profile
  const { serviceAPI, chainAPI, vaultAPI } = APIS

  log({ type: 'encoder', data: [`Register as encoder`] })
  await vaultAPI.initEncoder({}, log)
  const encoderKey = await vaultAPI.encoder.publicKey
  const myAddress = await vaultAPI.chainKeypair.address
  log({ type: 'encoder', data: [`My address ${myAddress}`] })
  const signer = await vaultAPI.chainKeypair
  const nonce = await vaultAPI.getNonce()

  const blockNow = await chainAPI.getBlockNumber()
  const until = new Date('Dec 26, 2021 23:55:00')
  const untilBlock = dateToBlockNumber ({ dateNow: new Date(), blockNow, date: until })
  const duration = { from: blockNow, until: untilBlock }
  const form = registrationForm('encoder', duration)
  await chainAPI.registerEncoder({ form, encoderKey, signer, nonce })
  await chainAPI.listenToEvents(handleEvent)

  // EVENTS
  async function isForMe (encoders, event) {
    for (var i = 0, len = encoders.length; i < len; i++) {
      const id = encoders[i]
      const peerAddress = await chainAPI.getUserAddress(id)
      if (peerAddress === myAddress) {
        log({ type: 'chainEvent', data: [`Encoder ${id}:  Event received: ${event.method} ${event.data.toString()}`] })
        return true
      }
    }
  }
  async function handleEvent (event) {
    if (event.method === 'RegisteredForEncoding') {
      const [userID] = event.data
      const encoderAddress = await chainAPI.getUserAddress(userID)
      if (encoderAddress === myAddress) {
        log({ type: 'encoder', data: [`Event received: ${event.method} ${event.data.toString()}`] })
      }
    }
    if (event.method === 'NewAmendment') {
      const [amendmentID] = event.data
      const amendment = await chainAPI.getAmendmentByID(amendmentID)
      const contract = await chainAPI.getContractByID(amendment.contract)
      const { encoders, attestors } = amendment.providers
      if (!await isForMe(encoders, event)) return
      // log({ type: 'chainEvent', data: [`Event received: ${event.method} ${event.data.toString()}`] })
      const { attestorKey, feedKey, ranges } = await getHostingData(attestors,contract)
      const data = { amendmentID, account: vaultAPI, attestorKey, encoderKey, feedKey, ranges }
      await serviceAPI.encode(data).catch((error) => log({ type: 'error', data: [`error: ${error}`] }))
      log({ type: 'encoder', data: [`Encoding done`] })
    }
  }

  // HELPERS

  async function getHostingData (attestors, contract) {
    const ranges = contract.ranges
    const planID = contract.plan
    const feedID = contract.feed
    const feedKey = await chainAPI.getFeedKey(feedID)
    const [attestorID] = attestors
    const attestorKey = await chainAPI.getAttestorKey(attestorID)
    return { attestorKey, feedKey, ranges }
  }
}
