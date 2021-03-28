const registrationForm = require('../registrationForm')
const dateToBlockNumber = require('../dateToBlockNumber')
/******************************************************************************
  ROLE: Hoster
******************************************************************************/
module.exports = role

async function role (profile, APIS) {
  const { name, log } = profile
  const { serviceAPI, chainAPI, vaultAPI } = APIS

  log({ type: 'hoster', data: [`Register as hoster`] })
  await vaultAPI.initHoster({}, log)
  const hosterKey = await vaultAPI.hoster.publicKey
  const myAddress = await vaultAPI.chainKeypair.address
  log({ type: 'hoster', data: [`My address ${myAddress}`] })
  const signer = await vaultAPI.chainKeypair
  const nonce = await vaultAPI.getNonce()


  const blockNow = await chainAPI.getBlockNumber()
  const until = new Date('Dec 26, 2021 23:55:00')
  const untilBlock = dateToBlockNumber ({ dateNow: new Date(), blockNow, date: until })
  const settings = { from: blockNow, until: untilBlock }
  const form = registrationForm('hoster', settings)
  await chainAPI.registerHoster({ form, hosterKey, signer, nonce })
  await chainAPI.listenToEvents(handleEvent)

  // EVENTS
  async function isForMe (hosters, event) {
    for (var i = 0, len = hosters.length; i < len; i++) {
      const id = hosters[i]
      const peerAddress = await chainAPI.getUserAddress(id)
      if (peerAddress === myAddress) {
        log({ type: 'hoster', data: [`Hoster ${id}:  Event received: ${event.method} ${event.data.toString()}`] })
        return true
      }
    }
  }
  async function handleEvent (event) {
    if (event.method === 'RegisteredForHosting') {
      const [userID] = event.data
      const hosterAddress = await chainAPI.getUserAddress(userID)
      if (hosterAddress === myAddress) {
        log({ type: 'hoster', data: [`Event received: ${event.method} ${event.data.toString()}`] })
      }
    }
    if (event.method === 'NewAmendment') {
      const [amendmentID] = event.data
      const amendment = await chainAPI.getAmendmentByID(amendmentID)
      const contract = await chainAPI.getContractByID(amendment.contract)
      const { hosters, attestors } = amendment.providers
      if (!await isForMe(hosters, event)) return
      const { feedKey, attestorKey, plan } = await getHostingData(attestors, contract)
      const data = { amendmentID, account: vaultAPI, hosterKey, feedKey, attestorKey, plan }
      await serviceAPI.host(data).catch((error) => log({ type: 'error', data: [`Error: ${error}`] }))
      log({ type: 'hoster', data: [`Hosting for the amendment ${amendmentID} started`] })
    }
    if (event.method === 'DropHosting') {
      const [feedID, hosterID] = event.data
      const hosterAddress = await chainAPI.getUserAddress(hosterID)
      if (hosterAddress === myAddress) {
        // @TODO close all the connections related to this feed
        log({ type: 'hoster', data: [`Hoster ${hosterID}:  Event received: ${event.method} ${event.data.toString()}`] })
        const feedKey = await chainAPI.getFeedKey(feedID)
        // await serviceAPI.removeFeed({ feedKey, account: vaultAPI }).catch((error) => log({ type: 'error', data: [`Error: ${error}`] }))
        // @TODO cancel hosting = remove feed, get out of swarm...
      }
    }
    if (event.method === 'NewStorageChallenge') {
      log({ type: 'hoster', data: [`NewStorageChallenge event for hoster`] })
      const [storageChallengeID] = event.data
      const storageChallenge = await chainAPI.getStorageChallengeByID(storageChallengeID)
      const contract = await chainAPI.getContractByID(storageChallenge.contract)
      const hosterID = storageChallenge.hoster
      const hosterAddress = await chainAPI.getUserAddress(hosterID)
      if (hosterAddress === myAddress) {
        log({ type: 'hoster', data: [`Hoster ${hosterID}:  Event received: ${event.method} ${event.data.toString()}`] })
        const data = await getStorageChallengeData(storageChallenge, contract)
        data.account = await vaultAPI
        data.hosterKey = hosterKey
        data.storageChallenge = storageChallenge
        // log({ type: 'hoster', data: [`sendStorageChallengeToAttestor - ${data}`] })
        await serviceAPI.sendStorageChallengeToAttestor(data).catch((error) => log({ type: 'error', data: [`Error: ${error}`] }))
        // await serviceAPI.sendStorageChallengeToAttestor(data).catch((error) => log({ type: 'error', data: [`Error: ${error}`] }))
        log({ type: 'hoster', data: [`sendStorageChallengeToAttestor completed`] })
      }
    }
  }

  // HELPERS

  async function getHostingData (attestors, contract) {
    const ranges = contract.ranges
    const [attestorID] = attestors
    const attestorKey = await chainAPI.getAttestorKey(attestorID)
    const feedID = contract.feed
    const feedKey = await chainAPI.getFeedKey(feedID)
    const objArr = ranges.map(range => ({ start: range[0], end: range[1] }))
    const plan = { ranges: objArr }
    return { feedKey, attestorKey, plan }
  }

  async function getStorageChallengeData (storageChallenge, contract) {
    const feedID = contract.feed
    const feedKey = await chainAPI.getFeedKey(feedID)
    const attestorID = storageChallenge.attestor
    const attestorKey = await chainAPI.getAttestorKey(attestorID)
    // const proofs = await serviceAPI.getStorageChallenge({ account: vaultAPI, storageChallenge, feedKey }).catch((error) => log({ type: 'error', data: [`Error: ${error}`] }))
    return { feedKey, attestorKey }
  }
}
