const debug = require('debug')
const getChainAPI = require('../chainAPI')
const getChatAPI = require('../../lab/scenarios/chatAPI')

/******************************************************************************
  ROLE: sponsor
******************************************************************************/
const ROLE = __filename.split('/').pop().split('.')[0].toLowerCase()

module.exports = role

async function role (profile, config) {
  const { name, account } = profile
  const log = debug(`[${name.toLowerCase()}:${ROLE}]`)
  profile.log = log
  log('I am a sponsor')
  const chainAPI = await getChainAPI(profile, config.chain.join(':'))
  const chatAPI = await getChatAPI(profile, config.chat.join(':'))
  chainAPI.listenToEvents(handleEvent)

  const myAddress = account.chainKeypair.address
  const signer = account.chainKeypair

  // EVENTS
  async function handleEvent (event) {
    if (event.method === 'FeedPublished') {
      const [feedID] = event.data
      log('Event received:', event.method, event.data.toString())
      const nonce = await account.getNonce()
      const plan = makePlan(feedID)
      await chainAPI.publishPlan({ plan, signer, nonce })
    }
    if (event.method === 'HostingStarted') {
      const [contractID, userID] = event.data
      const { plan: planID } = await chainAPI.getContractByID(contractID)
      const { sponsor: sponsorID } = await chainAPI.getPlanByID(planID)
      const sponsorAddress = await chainAPI.getUserAddress(sponsorID)
      if (sponsorAddress === myAddress) {
        log('Event received:', event.method, event.data.toString())
        const nonce = await account.getNonce()
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
        log('Event received:', event.method, event.data.toString())
      }
    }
    if (event.method === 'PerformanceChallengeConfirmed') {
      const [performanceChallengeID] = event.data
      const { contract: contractID } = await chainAPI.getPerformanceChallengeByID(performanceChallengeID)
      const { plan: planID } = await chainAPI.getContractByID(contractID)
      const { sponsor: sponsorID } = await chainAPI.getPlanByID(planID)
      const sponsorAddress = await chainAPI.getUserAddress(sponsorID)
      if (sponsorAddress === myAddress) {
        log('Event received:', event.method, event.data.toString())
      }
    }
  }

  // HELPERS

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
      from       : '', // date
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
