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
      const feed1 = { id: feedID, ranges: [[0,3], [5,8], [10,14]] }
      const feeds = [feed1 /*, ... */]
      const plan = makePlan({ feeds })
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
 // all feeds under one Plan have same hosting settings
  function makePlan ({ feeds }) {
    for (var i = 0; i < feeds.length; i++) {
      const size = getSize(feeds[i].ranges)
      feeds[i].size = size
    }
    const config = {
      performance: {
        availability: '', // percentage_decimal
        bandwidth: { /*'speed', 'guarantee'*/ }, // bitspersecond, percentage_decimal
        latency: { /*'lag', 'guarantee'*/ }, // milliseconds, percentage_decimal
      },
      regions: [{
        region: '',  // at least 1 region is mandatory (defaults to global)
        performance: {
          availability: '', // percentage_decimal
          bandwidth: { /*'speed', 'guarantee'*/ }, // bitspersecond, percentage_decimal
          latency: {  /*'lag', 'guarantee'*/ }, // milliseconds, percentage_decimal
        }
      }/*, ...*/]
    }
    return {
      feeds,
      from       : new Date('October 25, 2020 02:52:00'), // or new Date('Apr 30, 2000')
      until: {
        time     : new Date('October 25, 2020 01:48:00'), // date
        budget   : '',
        traffic  : '',
        price    : '',
      },
      importance : '', // 1-3? 1-10?
      config, // general config
      schedules: [],
      // schedules  : [{
      //   duration : '', // milliseconds
      //   delay    : '', // milliseconds
      //   interval : '', // milliseconds
      //   repeat   : '', // number
      //   config // specialized config for each schedule
      // }]
    }
  }

  function getSize (ranges) { // [[0,3], [5,8], [10,14]]
    var size = 0
    for (var i = 0; i < ranges.length; i++) { size = size + (ranges[i][1] - ranges[i][0]) } // [0,3]
    return size*64 // each chunk is 64kb
  }
}
