const debug = require('debug')
const getData = require('../getFeed')
const getChainAPI = require('../chainAPI')
// const serviceAPI = require('../..')


/******************************************************************************
  ROLE: Publisher
******************************************************************************/
const NAME = __filename.split('/').pop().split('.')[0].toLowerCase()

module.exports = role

async function role ({ name, account }) {
  const log = debug(`[${name.toLowerCase()}:${NAME}]`)
  const chainAPI = await getChainAPI()
  chainAPI.listenToEvents(handleEvent)

  //create or use existing data
  const data = await getData(account)
  log('Publishing data', data[0].toString('hex'))
  const myAddress = account.chainKeypair.address
  const nonce = account.getNonce()
  const plan = { ranges: [[0,8]] }
  // publish data and plan to chain (= request hosting)
  await chainAPI.publishFeedAndPlan({merkleRoot: data, plan, signer: myAddress, nonce})

  // EVENTS
  async function handleEvent (event) {

    if (event.method === 'HostingStarted') {
      const [ contractID] = event.data
      const { plan: planID } = await chainAPI.getContractByID(contractID)
      const { publisher: publisherID} = await chainAPI.getPlanByID(planID)
      const publisherAddress = await chainAPI.getUserAddress(publisherID)
      if (publisherAddress === myAddress) {
        log('Event received:', event.method, event.data.toString())
        const { feed: feedID } =  await chainAPI.getPlanByID(planID)
        const nonce = account.getNonce()
        await chainAPI.requestProofOfStorageChallenge({contractID, signer: myAddress, nonce})
      }
    }

    if (event.method === 'ProofOfStorageConfirmed') {
      const [ contractID] = event.data
      const { plan: planID } = await chainAPI.getContractByID(contractID)
      const { publisher: publisherID} = await chainAPI.getPlanByID(planID)
      const publisherAddress = await chainAPI.getUserAddress(publisherID)
      if (publisherAddress === myAddress) {
        log('Event received:', event.method, event.data.toString())
        const { feed: feedID } =  await chainAPI.getPlanByID(planID)
        const nonce = account.getNonce()
        await chainAPI.requestAttestation({contractID, signer: myAddress, nonce})
      }
    }

    if (event.method === 'AttestationReportConfirmed') {
      const [ contractID] = event.data
      const { plan: planID } = await chainAPI.getContractByID(contractID)
      const { publisher: publisherID} = await chainAPI.getPlanByID(planID)
      const publisherAddress = await chainAPI.getUserAddress(publisherID)
      if (publisherAddress === myAddress) {
        log('Event received:', event.method, event.data.toString())
      }
    }

  }

}
