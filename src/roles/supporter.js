const debug = require('debug')
const getData = require('../getFeed')
const getChainAPI = require('../chainAPI')
// const serviceAPI = require('../..')


/******************************************************************************
  ROLE: supporter
******************************************************************************/
const ROLE = __filename.split('/').pop().split('.')[0].toLowerCase()

module.exports = role

async function role ({ name, account }) {
  const log = debug(`[${name.toLowerCase()}:${ROLE}]`)
  log('I am a supporter')
  const chainAPI = await getChainAPI()
  chainAPI.listenToEvents(handleEvent)

  const myAddress = account.chainKeypair.address
  const signer = account.chainKeypair

  // EVENTS
  async function handleEvent (event) {
    if (event.method === 'FeedPublished') {
      const [ feedID] = event.data
      log('Event received:', event.method, event.data.toString())
      const nonce = await account.getNonce()
      // @TODO later pass a more sofisticated plan which will include ranges
      const ranges = [[0,8]]
      const plan = { ranges, feedID }
      await chainAPI.publishPlan({ plan, signer, nonce })
    }
    if (event.method === 'HostingStarted') {
      const [ contractID, userID] = event.data
      const { plan: planID } = await chainAPI.getContractByID(contractID)
      const { supporter: supporterID} = await chainAPI.getPlanByID(planID)
      const supporterAddress = await chainAPI.getUserAddress(supporterID)
      if (supporterAddress === myAddress) {
        log('Event received:', event.method, event.data.toString())
        const { feed: feedID } =  await chainAPI.getPlanByID(planID)
        const nonce = await account.getNonce()
        // @TODO:Request regular challenges
        await chainAPI.requestStorageChallenge({contractID, hosterID: userID, signer, nonce})
        await chainAPI.requestPerformanceChallenge({contractID, signer, nonce})
      }
    }
    if (event.method === 'performanceChallengeConfirmed') {
      const [ performanceChallengeID] = event.data
      const { contract: contractID } = await chainAPI.getPerformanceChallengeByID(performanceChallengeID)
      const { plan: planID } = await chainAPI.getContractByID(contractID)
      const { supporter: supporterID} = await chainAPI.getPlanByID(planID)
      const supporterAddress = await chainAPI.getUserAddress(supporterID)
      if (supporterAddress === myAddress) {
        log('Event received:', event.method, event.data.toString())
      }
    }
  }
}
