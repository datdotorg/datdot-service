/******************************************************************************
  ROLE: sponsor
******************************************************************************/

module.exports = role

async function role (profile, APIS) {
  const { name, log } = profile
  const { serviceAPI, chainAPI, vaultAPI } = APIS

  log({ type: 'sponsor', body: [`I am a sponsor`] })
  await chainAPI.listenToEvents(handleEvent)
  const myAddress = vaultAPI.chainKeypair.address
  const signer = vaultAPI.chainKeypair

  // EVENTS
  async function handleEvent (event) {
    if (event.method === 'FeedPublished') {
      const [feedID] = event.data
      // log({ type: 'chainEvent', body: [`Event received: ${event.method} ${event.data.toString()}`] })
      log({ type: 'chainEvent', body: [`Event received: ${event.method} ${event.data.toString()}`] })

      const nonce = await vaultAPI.getNonce()
      const plan = makePlan(feedID)
      await chainAPI.publishPlan({ plan, signer, nonce })
    }
    if (event.method === 'HostingStarted') {
      const [contractID, userID] = event.data
      const { plan: planID } = await chainAPI.getContractByID(contractID)
      const { sponsor: sponsorID } = await chainAPI.getPlanByID(planID)
      const sponsorAddress = await chainAPI.getUserAddress(sponsorID)
      if (sponsorAddress === myAddress) {
        // log({ type: 'chainEvent', body: [`Event received: ${event.method} ${event.data.toString()}`] })
        log({ type: 'chainEvent', body: [`Event received: ${event.method} ${event.data.toString()}`] })
        const nonce = await vaultAPI.getNonce()
        // @TODO:Request regular challenges
        await chainAPI.requestStorageChallenge({ contractID, hosterID: userID, signer, nonce })
        await chainAPI.requestPerformanceChallenge({ contractID, signer, nonce })
      }
    }
    if (event.method === 'StorageChallengeConfirmed') {
      const [storageChallengeID] = event.data
      const { contract: contractID } = await chainAPI.getStorageChallengeByID(storageChallengeID)
      const { plan: planID } = await chainAPI.getContractByID(contractID)
      const { sponsor: sponsorID } = await chainAPI.getPlanByID(planID)
      const sponsorAddress = await chainAPI.getUserAddress(sponsorID)
      if (sponsorAddress === myAddress) {
        // log({ type: 'chainEvent', body: [`Event received: ${event.method} ${event.data.toString()}`] })
        log({ type: 'chainEvent', body: [`Event received: ${event.method} ${event.data.toString()}`] })

      }
    }
    if (event.method === 'PerformanceChallengeConfirmed') {
      const [performanceChallengeID] = event.data
      const { contract: contractID } = await chainAPI.getPerformanceChallengeByID(performanceChallengeID)
      const { plan: planID } = await chainAPI.getContractByID(contractID)
      const { sponsor: sponsorID } = await chainAPI.getPlanByID(planID)
      const sponsorAddress = await chainAPI.getUserAddress(sponsorID)
      if (sponsorAddress === myAddress) {
        // log({ type: 'chainEvent', body: [`Event received: ${event.method} ${event.data.toString()}`] })
        log({ type: 'chainEvent', body: [`Event received: ${event.method} ${event.data.toString()}`] })

      }
    }
  }

  // HELPERS

 // See example https://pastebin.com/5nAb6XHQ
  function makePlan (feedID) {
    const config = { // at least 1 region is mandatory (e.g. global)
      performance: {
        availability: '', // percentage_decimal
        bandwidth: { /*'speed', 'guarantee'*/ }, // bitspersecond, percentage_decimal
        latency: { /*'lag', 'guarantee'*/ }, // milliseconds, percentage_decimal
      },
      regions: [{
        region: '', // e.g. 'NORTH AMERICA', @TODO: see issue, e.g. latitude, longitude
        performance: {
          availability: '', // percentage_decimal
          bandwidth: { /*'speed', 'guarantee'*/ }, // bitspersecond, percentage_decimal
          latency: {  /*'lag', 'guarantee'*/ }, // milliseconds, percentage_decimal
        }
      }/*, ...*/]
    }
    return {
      feeds: [{ id: feedID, ranges: [[0,8]] }/*, ...*/],
      from       : new Date(), // or new Date('Apr 30, 2000')
      until: {
        time     : '', // date
        budget   : '',
        traffic  : '',
        price    : '',
      },
      importance : '', // 1-3? 1-10?
      config, // general config
      schedules  : [{
        duration : '', // milliseconds
        delay    : '', // milliseconds
        interval : '', // milliseconds
        repeat   : '', // number
        config // specialized config for each schedule
      }]
    }
  }
}
