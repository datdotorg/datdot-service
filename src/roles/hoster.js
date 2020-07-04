const debug = require('debug')
const getChainAPI = require('../chainAPI')
const getServiceAPI = require('../serviceAPI')

/******************************************************************************
  ROLE: Hoster
******************************************************************************/
const NAME = __filename.split('/').pop().split('.')[0].toLowerCase()

module.exports = role

async function role ({ name, account }) {
  const log = debug(`[${name.toLowerCase()}:${NAME}]`)
  log('Register as hoster')
  const serviceAPI = getServiceAPI()
  const chainAPI = await getChainAPI()

  await account.initHoster()
  const hosterKey = account.hoster.publicKey
  const myAddress = account.chainKeypair.address
  chainAPI.listenToEvents(handleEvent)
  const nonce = account.getNonce()
  await chainAPI.registerHoster({hosterKey, signer: myAddress, nonce})

// EVENTS
  async function handleEvent (event) {

    if (event.method === 'NewContract') {
      const [contractID] = event.data
      const contract = await chainAPI.getContractByID(contractID)
      const hosterAddress = await chainAPI.getUserAddress(contract.hoster)
      if (hosterAddress === myAddress) {
        log('Event received:', event.method, event.data.toString())
        const { feedKeyBuffer, encoderKey, plan } = await getHostingData(contract)
        const host = serviceAPI.host({hoster: account, feedKeyBuffer , encoderKey, plan})
        host.then(async () => {
          const nonce = account.getNonce()
          await chainAPI.hostingStarts({contractID, signer: myAddress, nonce})
        })
      }
    }

    if (event.method === 'NewProofOfStorageChallenge') {
      const [challengeID] = event.data
      const challenge = await chainAPI.getChallengeByID(challengeID)
      const contract = await chainAPI.getContractByID(challenge.contract)
      const hosterAddress = await chainAPI.getUserAddress(contract.hoster)
      if (hosterAddress === myAddress) {
        log('Event received:', event.method, event.data.toString())
        const { feed: feedID } = await chainAPI.getPlanByID(contract.plan)
        const feedKey = await chainAPI.getFeedKey(feedID)
        const feedKeyBuffer = Buffer.from(feedKey, 'hex')
        const data = { account, challenge, feedKeyBuffer }
        const proof = await serviceAPI.getProofOfStorage(data)
        const nonce = account.getNonce()
        await chainAPI.submitProofOfStorage({challengeID, proof, signer: myAddress, nonce})
      }
    }
  }

  // HELPERS

  async function getHostingData (contract) {
    const ranges = contract.ranges
    const encoderID = contract.encoder
    const encoderKey = await chainAPI.getEncoderKey(encoderID)
    const planID = contract.plan
    const { feed: feedID } = await chainAPI.getPlanByID(planID)
    const feedKey = await chainAPI.getFeedKey(feedID)
    const feedKeyBuffer = Buffer.from(feedKey, 'hex')
    const objArr = ranges.map( range => ({start: range[0], end: range[1]}) )
    const plan = { ranges: objArr }
    return { feedKeyBuffer, encoderKey, plan }
  }


}
