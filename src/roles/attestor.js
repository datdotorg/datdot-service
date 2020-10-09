const registrationForm = require('../registrationForm')
/******************************************************************************
  ROLE: Attestor
******************************************************************************/

module.exports = role

async function role (profile, APIS) {
  const { name, log } = profile
  const { serviceAPI, chainAPI, vaultAPI } = APIS

  log({ type: 'attestor', body: [`Register as attestor`] })
  chainAPI.listenToEvents(handleEvent)
  await vaultAPI.initAttestor({}, log)
  const attestorKey = vaultAPI.attestor.publicKey
  const myAddress = vaultAPI.chainKeypair.address
  const signer = vaultAPI.chainKeypair
  const nonce = await vaultAPI.getNonce()
  const settings = { from: new Date(), until: '' }
  const form = registrationForm('attestor', settings)
  await chainAPI.registerAttestor({ form, attestorKey, signer, nonce })

  // EVENTS
  // async function isForMe (peerids) {
  //   peerids = [].concat(peerids)
  //   for (var i = 0, len = peerids.length; i < len; i++) {
  //     const id = peerids[i]
  //     const peerAddress = await chainAPI.getUserAddress(id)
  //     if (peerAddress === myAddress) return true
  //   }
  // }
  async function handleEvent (event) {
    if (event.method === 'NewContract') {
      const [contractID] = event.data
      const contract = await chainAPI.getContractByID(contractID)
      const attestorID = contract.attestor
      const attestorAddress = await chainAPI.getUserAddress(attestorID)
      if (attestorAddress !== myAddress) return
      log({ type: 'chainEvent', body: [`Event received: ${event.method} ${event.data.toString()}`] })
      const { feedKey, encoderKeys, hosterKeys } = await getContractData(contract)
      const results = await serviceAPI.verifyEncoding({ account: vaultAPI, hosterKeys, attestorKey, feedKey, encoderKeys, contractID }).catch((error) => log({ type: 'error', body: [`Error: ${error}`] }))
      log({ type: 'attestor', body: [`Verify encoding done: ${results}`] })
      // const contract = await getContractData(event.data, isForMe)
      // if (!contract) return
      // const { feedKey, encoderKeys, hosterKeys } = contract
      // await serviceAPI.verifyEncoding({ account: vaultAPI, hosterKeys, attestorKey, feedKey, encoderKeys, contractID })
    }
    if (event.method === 'NewPerformanceChallenge') {
      const [performanceChallengeID] = event.data
      const performanceChallenge = await chainAPI.getPerformanceChallengeByID(performanceChallengeID)
      const attestors = performanceChallenge.attestors
      attestors.forEach(async (attestorID) => {
        const attestorAddress = await chainAPI.getUserAddress(attestorID)
        if (attestorAddress === myAddress) {
          log({ type: 'chainEvent', body: [`Event received: ${event.method} ${event.data.toString()}`] })
          const contractID = performanceChallenge.contract
          const contract = await chainAPI.getContractByID(contractID)
          const feedID = contract.feed
          const feedKey = await chainAPI.getFeedKey(feedID)
          const ranges = contract.ranges
          const randomChunks = ranges.map(range => getRandomInt(range[0], range[1] + 1))
          // @TODO: meet with other attestors in the swarm to decide on random number of attestors
          // @TODO: sign random number
          // @TODO: add time of execution for each attestor
          // @TODO: select a reporter
          // const meeting = await serviceAPI.meetAttestors(feedKey)
          const data = { account: vaultAPI, randomChunks, feedKey }
          const report = await serviceAPI.checkPerformance(data).catch((error) => log({ type: 'error', body: [`Error: ${error}`] }))
          const nonce = await vaultAPI.getNonce()
          await chainAPI.submitPerformanceChallenge({ performanceChallengeID, report, signer, nonce })
        }
      })
    }
    if (event.method === 'NewStorageChallenge') {
      const [storageChallengeID] = event.data
      const storageChallenge = await chainAPI.getStorageChallengeByID(storageChallengeID)
      const attestorID = storageChallenge.attestor
      const attestorAddress = await chainAPI.getUserAddress(attestorID)
      if (attestorAddress === myAddress) {
        log({ type: 'chainEvent', body: [`Event received: ${event.method} ${event.data.toString()}`] })
        const data = await getStorageChallengeData(storageChallenge)
        data.account = vaultAPI
        data.attestorKey = attestorKey
        const proofs = await serviceAPI.verifyStorageChallenge(data).catch((error) => log({ type: 'error', body: [`Error: ${error}`] }))
        log({ type: 'attestor', body: [`Got all the proofs`] })
        if (proofs) {
          const nonce = vaultAPI.getNonce()
          const opts = { storageChallengeID, proofs, signer, nonce }
          await chainAPI.submitStorageChallenge(opts)
        }
      }
    }
  }

  // HELPERS

  async function getStorageChallengeData (storageChallenge) {
    const hosterID = storageChallenge.hoster
    const hosterKey = await chainAPI.getHosterKey(hosterID)
    const contract = await chainAPI.getContractByID(storageChallenge.contract)
    const feedID = contract.feed
    const feedKey = await chainAPI.getFeedKey(feedID)
    return { hosterKey, feedKey, storageChallenge }
  }

  async function getContractData (contract) {
    const encoders = contract.encoders
    const encoderKeys = []
    encoders.forEach(async (id) => {
      const key = await chainAPI.getEncoderKey(id)
      encoderKeys.push(key)
    })
    const hosters = contract.hosters
    const hosterKeys = []
    hosters.forEach(async (id) => {
      const key = await chainAPI.getHosterKey(id)
      hosterKeys.push(key)
    })
    const feedID = contract.feed
    const feedKey = await chainAPI.getFeedKey(feedID)
    return { feedKey, encoderKeys, hosterKeys }
  }

  function getRandomInt (min, max) {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min)) + min // The maximum is exclusive and the minimum is inclusive
  }
}
