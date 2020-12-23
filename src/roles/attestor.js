const registrationForm = require('../registrationForm')
const dateToBlockNumber = require('../dateToBlockNumber')
const tempDB = require('../tempdb')

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
  const signer = vaultAPI.chainKeypair
  const nonce = await vaultAPI.getNonce()
  log({ type: 'attestor', body: [`My address ${myAddress}`] })

  const jobsDB = await tempDB(attestorKey)

  const blockNow = await chainAPI.getBlockNumber()
  const until = new Date('Dec 26, 2021 23:55:00')
  const untilBlock = dateToBlockNumber ({ dateNow: new Date(), blockNow, date: until })
  const settings = { from: blockNow, until: untilBlock }
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

    // function unpublishedPlan_jobIDs (planID) {
    //   const plan = getPlanById(planID)
    //   const jobIDs = plan.contracts.map(contractID => {
    //     const contract = getContractByID(contractID)
    //     const amendmentIDs = contract.ammendments
    //     const lastID = amendmentIDs[ammendments.length - 1]
    //     return lastID
    //   }).filter(async jobID => {
    //     const ammendment = getAmmendmentByID(jobID)
    //     const [attestorID] = ammendment.providers.attestors
    //     const attestorAddress = await chainAPI.getUserAddress(attestorID)
    //     if (attestorAddress === myAddress) return true
    //   })
    //   return jobIDs
    // }
    if (event.method === 'UnpublishPlan') {
      const [planID] = event.data
      const jobIDs = unpublishedPlan_jobIDs(planID)
      jobIDs.forEach(jobID => {

        const job = jobsDB.get(jobID)
        if (job) { /* @TODO: ... */ }

      })
    }
    if (event.method === 'DropHosting') {

      attestorAddress

      const [planID] = event.data
      const jobIDs = unpublishedPlan_jobIDs(planID)

      jobIDs.forEach(jobID => {

        const job = jobsDB.get(jobID)
        if (job) { /* @TODO: ... */ }

      })
    }


    if (event.method === 'NewAmendment') {
      const [amendmentID] = event.data
      const amendment = await chainAPI.getAmendmentByID(amendmentID)
      const contract = await chainAPI.getContractByID(amendment.contract)
      const [attestorID] = amendment.providers.attestors
      const attestorAddress = await chainAPI.getUserAddress(attestorID)
      if (attestorAddress !== myAddress) return
      log({ type: 'chainEvent', body: [`Attestor ${attestorID}: Event received: ${event.method} ${event.data.toString()}`] })
      const { feedKey, encoderKeys, hosterKeys, ranges } = await getData(amendment, contract)

      const task = { account: vaultAPI, hosterKeys, attestorKey, feedKey, encoderKeys, amendmentID, ranges }
      const ref = amendmentID
      jobsDB.put(ref, task)

      jobsDB.list().forEach((ref, currentState => {

        var controller = new AbortController()
        // controller.abort()
        var signal = controller.signal

        resume(ref, currentState, signal)
      })
      // @TODO: what if process crash and restart?
      // @TODO: how to lookup and abort on another event?
      var controller = new AbortController()
      // controller.abort()
      var signal = controller.signal
      signal.onabort = event => {}


      const failedKeys = await serviceAPI.verifyAndForwardEncodings(task, {}, signal)
      // .catch((error) => log({ type: 'error', body: [`Error: ${error}`] }))
      log({ type: 'attestor', body: [`Resolved all the responses for amendment: ${amendmentID}: ${failedKeys}`] })
      if (failedKeys) {
        const failed = []
        if (failedKeys.length) {
          for (var i = 0, len = failedKeys.length; i < len; i++) {
            const key = failedKeys[i]
            if (key) {
              const id = await chainAPI.getUserIDByKey(key)
              failed.push(id)
            }
          }
        }
        const report = { id: amendmentID, failed }
        const encoders = amendment.encoders
        const nonce = vaultAPI.getNonce()
        await chainAPI.amendmentReport({ report, signer, nonce })
        jobsDB.del(ref)
      }
      // const contract = await getData(event.data, isForMe)
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

  async function getData (amendment, contract) {
    const { encoders, hosters } = amendment.providers
    const encoderKeys = []
    encoders.forEach(async (id) => {
      const key = await chainAPI.getEncoderKey(id)
      encoderKeys.push(key)
    })
    const hosterKeys = []
    hosters.forEach(async (id) => {
      const key = await chainAPI.getHosterKey(id)
      hosterKeys.push(key)
    })
    const feedID = contract.feed
    const feedKey = await chainAPI.getFeedKey(feedID)
    const ranges = contract.ranges
    return { feedKey, encoderKeys, hosterKeys, ranges }
  }

  function getRandomInt (min, max) {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min)) + min // The maximum is exclusive and the minimum is inclusive
  }
}
