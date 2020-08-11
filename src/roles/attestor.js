const debug = require('debug')
const getChainAPI = require('../chainAPI')
const getServiceAPI = require('../serviceAPI')


/******************************************************************************
  ROLE: Attestor
******************************************************************************/
const ROLE = __filename.split('/').pop().split('.')[0].toLowerCase()

module.exports = role

async function role ({ name, account }) {
  const log = debug(`[${name.toLowerCase()}:${ROLE}]`)
  log('Register as attestor')
  const serviceAPI = getServiceAPI()
  const chainAPI = await getChainAPI()
  chainAPI.listenToEvents(handleEvent)

  await account.initAttestor()
  const attestorKey = account.attestor.publicKey
  const myAddress = account.chainKeypair.address
  const signer = account.chainKeypair
  const nonce = await account.getNonce()
  await chainAPI.registerAttestor({attestorKey, signer, nonce})

  // EVENTS
  async function handleEvent (event) {

    if (event.method === 'NewContract'){
      const [contractID] = event.data
      const contract = await chainAPI.getContractByID(contractID)
      const attestorID = contract.attestor
      const attestorAddress = await chainAPI.getUserAddress(attestorID)
      if (attestorAddress === myAddress) {
        log('Event received:', event.method, event.data.toString())
        const { feedKey, encoderKeys, hosterKeys } = await getContractData(contract)
        const foo = serviceAPI.verifyEncoding({account, hosterKeys, feedKey, encoderKeys})
        foo.then(async () => {
        })
      }
    }
    if (event.method === 'NewPerformanceChallenge') {
      const [performanceChallengeID] = event.data
      const performanceChallenge = await chainAPI.getPerformanceChallengeByID(performanceChallengeID)
      const attestors = performanceChallenge.attestors
      attestors.forEach(async (attestorID) => {
        const attestorAddress = await chainAPI.getUserAddress(attestorID)
        if (attestorAddress === myAddress) {
          log('Event received:', event.method, event.data.toString())
          const contractID = performanceChallenge.contract
          const contract = await chainAPI.getContractByID(contractID)
          const { feed: feedID } = await chainAPI.getPlanByID(contract.plan)
          const feedKey = await chainAPI.getFeedKey(feedID)
          const plan = await chainAPI.getPlanByID(contract.plan)
          const ranges = plan.ranges
          const randomChunks = ranges.map(range => getRandomInt(range[0], range[1] + 1))
          // @TODO: meet with other attestors in the swarm to decide on random number of attestors
          // @TODO: sign random number
          // @TODO: add time of execution for each attestor
          // @TODO: select a reporter
          // const meeting = await serviceAPI.meetAttestors(feedKey)
          const data = { account, randomChunks, feedKey }
          const report = await serviceAPI.attest(data)
          const nonce = await account.getNonce()
          await chainAPI.submitPerformanceChallenge({performanceChallengeID, report, signer, nonce})
        }
      })
    }
    if (event.method === 'NewStorageChallenge') {
      const [storageChallengeID] = event.data
      const storageChallenge = await chainAPI.getStorageChallengeByID(storageChallengeID)
      const attestorID = storageChallenge.attestor
      const attestorAddress = await chainAPI.getUserAddress(attestorID)
      if (attestorAddress === myAddress) {
        log('Event received:', event.method, event.data.toString())
        const data = await getStorageChallengeData(storageChallenge)
        data.account = account
        const hosterAddress = await chainAPI.getUserAddress(storageChallenge.hoster)
        const { feedKey, storageChallengeID, proofs} = await serviceAPI.verifyStorageChallenge(data)
        if (proofs) {
          const nonce = account.getNonce()
          const opts = {storageChallengeID, proofs, signer, nonce}
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
    const { feed: feedID } = await chainAPI.getPlanByID(contract.plan)
    const feedKey = await chainAPI.getFeedKey(feedID)
    return {hosterKey, feedKey, storageChallengeID: storageChallenge.id}
  }

  async function getContractData (contract) {
    // @TODO there's many encoders
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
    const planID = contract.plan
    const { feed: feedID } = await chainAPI.getPlanByID(planID)
    const feedKey = await chainAPI.getFeedKey(feedID)
    return { feedKey, encoderKeys, hosterKeys }
  }

  function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
  }

}
