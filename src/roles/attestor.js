const registrationForm = require('../registrationForm')
/******************************************************************************
  ROLE: Attestor
******************************************************************************/

module.exports = role

async function role (profile, APIS) {
  const { name, log } = profile
  const { serviceAPI, chainAPI, vaultAPI } = APIS

  log({ type: 'attestor', body: [`Register as attestor`] })
  await vaultAPI.initAttestor({}, log)
  const attestorKey = vaultAPI.attestor.publicKey
  const myAddress = vaultAPI.chainKeypair.address
  log({ type: 'attestor', body: [`My address ${myAddress}`] })
  const signer = vaultAPI.chainKeypair
  const nonce = await vaultAPI.getNonce()
  const settings = { from: new Date(), until: '' }
  const form = registrationForm('attestor', settings)
  await chainAPI.registerAttestor({ form, attestorKey, signer, nonce })
  chainAPI.listenToEvents(handleEvent)

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
    if (event.method === 'RegisteredForAttesting') {
      const [userID] = event.data
      const attestorAddress = await chainAPI.getUserAddress(userID)
      if (attestorAddress === myAddress) {
        log({ type: 'attestor', body: [`Event received: ${event.method} ${event.data.toString()}`] })
      }
    }
    if (event.method === 'NewContract') {
      const [contractID] = event.data
      const contract = await chainAPI.getContractByID(contractID)
      const [attestorID] = contract.providers.attestors
      const attestorAddress = await chainAPI.getUserAddress(attestorID)
      if (attestorAddress !== myAddress) return
      log({ type: 'chainEvent', body: [`Attestor ${attestorID}: Event received: ${event.method} ${event.data.toString()}`] })
      const { feedKey, encoderKeys, hosterKeys } = await getContractData(contract)
      const reports = await serviceAPI.verifyEncoding({ account: vaultAPI, hosterKeys, attestorKey, feedKey, encoderKeys, contractID }).catch((error) => log({ type: 'error', body: [`Error: ${error}`] }))
      log({ type: 'attestor', body: [`Verify encoding done: ${reports}`] })
      if (reports) {
        console.log('Sending reports')
        const nonce = vaultAPI.getNonce()
        await chainAPI.hostingStarts({ contractID, reports, signer, nonce })
      }
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
          log({ type: 'chainEvent', body: [`Attestor ${attestorID}:  Event received: ${event.method} ${event.data.toString()}`] })
          const contractID = performanceChallenge.contract
          const contract = await chainAPI.getContractByID(contractID)
          const feedID = contract.feed
          const feedKey = await chainAPI.getFeedKey(feedID)
          const ranges = contract.ranges
          const randomChunks = ranges.map(range => getRandomInt(range[0], range[1] + 1))
          // @TODO: meet with other attestors in the swarm to decide on random number of attestors
          //  sign random number
          //  add time of execution for each attestor
          //  select a reporter
          // const meeting = await serviceAPI.meetAttestors(feedKey)
          const data = { account: vaultAPI, randomChunks, feedKey }
          const report = await serviceAPI.checkPerformance(data).catch((error) => log({ type: 'error', body: [`Error: ${error}`] }))
          const nonce = await vaultAPI.getNonce()
          log({ type: 'attestor', body: [`Submitting performance challenge`] })
          await chainAPI.submitPerformanceChallenge({ performanceChallengeID, report, signer, nonce })
        }
      })
    }
    if (event.method === 'NewStorageChallenge') {
      const [storageChallengeID] = event.data
      const storageChallenge = await chainAPI.getStorageChallengeByID(storageChallengeID)
      log({ type: 'hoster', body: [`NewStorageChallenge event for attestor ${JSON.stringify(storageChallenge)}`] })
      const attestorID = storageChallenge.attestor
      const attestorAddress = await chainAPI.getUserAddress(attestorID)
      if (attestorAddress === myAddress) {
        log({ type: 'chainEvent', body: [`Attestor ${attestorID}:  Event received: ${event.method} ${event.data.toString()}`] })
        const data = await getStorageChallengeData(storageChallenge)
        data.account = vaultAPI
        data.attestorKey = attestorKey
        const proofs = await serviceAPI.verifyStorageChallenge(data).catch((error) => log({ type: 'error', body: [`Error: ${error}`] }))
        log({ type: 'attestor', body: [`Got all the proofs`] })
        if (proofs) {
          const response = makeResponse({ proofs, storageChallengeID})
          const nonce = vaultAPI.getNonce()
          const opts = { response, signer, nonce }
          log({ type: 'attestor', body: [`Submitting storage challenge`] })
          await chainAPI.submitStorageChallenge(opts)
        }
      }
    }
  }

  // HELPERS

  function makeResponse ({ proofs, storageChallengeID}) {
    const signature = 'foobar' // we will get the signature from the message
    const response = { storageChallengeID, signature }
    for (var i = 0, len = proofs.length; i < len; i++) {
      response.hashes = []
      const proof = proofs[i]
      const hash = proof // @TODO later hash the proof
      response.hashes.push(hash)
      // does hoster send a hash or does attestor decode and then hash?
    }
    // return hash, challengeID, signature of the event
    return response
  }

  async function getStorageChallengeData (storageChallenge) {
    const hosterID = storageChallenge.hoster
    const hosterKey = await chainAPI.getHosterKey(hosterID)
    const contract = await chainAPI.getContractByID(storageChallenge.contract)
    const feedID = contract.feed
    const feedKey = await chainAPI.getFeedKey(feedID)
    return { hosterKey, feedKey, storageChallenge }
  }

  async function getContractData (contract) {
    const encoders = contract.providers.encoders
    const encoderKeys = []
    encoders.forEach(async (id) => {
      const key = await chainAPI.getEncoderKey(id)
      encoderKeys.push(key)
    })
    const hosters = contract.providers.hosters
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
