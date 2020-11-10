const registrationForm = require('../registrationForm')
/******************************************************************************
  ROLE: Hoster
******************************************************************************/
module.exports = role

async function role (profile, APIS) {
  const { name, log } = profile
  const { serviceAPI, chainAPI, vaultAPI } = APIS

  log({ type: 'hoster', body: [`Register as hoster`] })
  await vaultAPI.initHoster({}, log)
  const hosterKey = vaultAPI.hoster.publicKey
  const myAddress = vaultAPI.chainKeypair.address
  log({ type: 'hoster', body: [`My address ${myAddress}`] })
  const signer = vaultAPI.chainKeypair
  const nonce = vaultAPI.getNonce()
  const settings = { from: new Date(), until: '' }
  const form = registrationForm('hoster', settings)
  await chainAPI.registerHoster({ form, hosterKey, signer, nonce })
  await chainAPI.listenToEvents(handleEvent)

  // EVENTS
  async function isForMe (hosters, event) {
    for (var i = 0, len = hosters.length; i < len; i++) {
      const id = hosters[i]
      const peerAddress = await chainAPI.getUserAddress(id)
      if (peerAddress === myAddress) {
        log({ type: 'hoster', body: [`Hoster ${id}:  Event received: ${event.method} ${event.data.toString()}`] })
        return true
      }
    }
  }
  async function handleEvent (event) {
    if (event.method === 'RegisteredForHosting') {
      const [userID] = event.data
      const hosterAddress = await chainAPI.getUserAddress(userID)
      if (hosterAddress === myAddress) {
        log({ type: 'hoster', body: [`Event received: ${event.method} ${event.data.toString()}`] })
      }
    }
    if (event.method === 'NewContract') {
      const [contractID] = event.data
      const contract = await chainAPI.getContractByID(contractID)
      const hosters = contract.providers.hosters
      if (!await isForMe(hosters, event)) return
      const { feedKey, attestorKey, plan } = await getHostingData(contract)
      const data = { contractID, account: vaultAPI, hosterKey, feedKey, attestorKey, plan }
      await serviceAPI.host(data).catch((error) => log({ type: 'error', body: [`Error: ${error}`] }))
      log({ type: 'hoster', body: [`Hosting for Contract ID: ${contractID} started`] })
    }
    if (event.method === 'DropHosting') {
      const [feedID, hosterID] = event.data
      const hosterAddress = await chainAPI.getUserAddress(hosterID)
      if (hosterAddress === myAddress) {
        log({ type: 'hoster', body: [`Hoster ${hosterID}:  Event received: ${event.method} ${event.data.toString()}`] })
        const feedKey = await chainAPI.getFeedKey(feedID)
        await serviceAPI.removeFeed({ feedKey, account: vaultAPI }).catch((error) => log({ type: 'error', body: [`Error: ${error}`] }))
      }
    }
    if (event.method === 'NewStorageChallenge') {
      log({ type: 'hoster', body: [`NewStorageChallenge event for hoster`] })
      const [storageChallengeID] = event.data
      const storageChallenge = await chainAPI.getStorageChallengeByID(storageChallengeID)
      const contract = await chainAPI.getContractByID(storageChallenge.contract)
      const hosterID = storageChallenge.hoster
      const hosterAddress = await chainAPI.getUserAddress(hosterID)
      if (hosterAddress === myAddress) {
        log({ type: 'hoster', body: [`Hoster ${hosterID}:  Event received: ${event.method} ${event.data.toString()}`] })
        const data = await getStorageChallengeData(storageChallenge, contract)
        data.account = vaultAPI
        data.hosterKey = hosterKey
        data.storageChallenge = storageChallenge
        // log({ type: 'hoster', body: [`sendStorageChallengeToAttestor - ${data}`] })
        await serviceAPI.sendStorageChallengeToAttestor(data).catch((error) => log({ type: 'error', body: [`Error: ${error}`] }))
        // await serviceAPI.sendStorageChallengeToAttestor(data).catch((error) => log({ type: 'error', body: [`Error: ${error}`] }))
        log({ type: 'hoster', body: [`sendStorageChallengeToAttestor completed`] })
      }
    }
  }

  // HELPERS

  async function getHostingData (contract) {
    const ranges = contract.ranges
    const [attestorID] = contract.providers.attestors
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
    // const proofs = await serviceAPI.getStorageChallenge({ account: vaultAPI, storageChallenge, feedKey }).catch((error) => log({ type: 'error', body: [`Error: ${error}`] }))
    return { feedKey, attestorKey }
  }
}
