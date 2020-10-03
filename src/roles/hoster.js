const registrationForm = require('../registrationForm')
/******************************************************************************
  ROLE: Hoster
******************************************************************************/
module.exports = role

async function role (profile, APIS) {
  const { name, log } = profile
  const { serviceAPI, chainAPI, vaultAPI } = APIS

  log({ type: 'hoster', body: [`Register as hoster`] })
  await chainAPI.listenToEvents(handleEvent)
  await vaultAPI.initHoster({}, log)
  const hosterKey = vaultAPI.hoster.publicKey
  const myAddress = vaultAPI.chainKeypair.address
  const signer = vaultAPI.chainKeypair
  const nonce = vaultAPI.getNonce()
  const settings = { from: Date.now(), until: '' }
  const form = registrationForm('hoster', settings)
  await chainAPI.registerHoster({ form, hosterKey, signer, nonce })

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
      const hosters = contract.hosters
      if (!await isForMe(hosters)) return
      log({ type: 'hoster', body: [`Event received: ${event.method} ${event.data.toString()}`] })
      const { feedKey, attestorKey, plan } = await getHostingData(contract)
      await serviceAPI.host({ contractID, account: vaultAPI, hosterKey, feedKey, attestorKey, plan }).catch((error) => log({ type: 'error', body: [`Error: ${error}`] }))
      const nonce = vaultAPI.getNonce()
      await chainAPI.hostingStarts({ contractID, signer, nonce })
    }

    if (event.method === 'NewStorageChallenge') {
      const [storageChallengeID] = event.data
      const storageChallenge = await chainAPI.getStorageChallengeByID(storageChallengeID)
      const contract = await chainAPI.getContractByID(storageChallenge.contract)
      const hosterID = storageChallenge.hoster
      const hosterAddress = await chainAPI.getUserAddress(hosterID)
      if (hosterAddress === myAddress) {
        log({ type: 'hoster', body: [`Event received: ${event.method} ${event.data.toString()}`] })
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
    const attestorID = contract.attestor
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
