const debug = require('debug')
const getChainAPI = require('../chainAPI')
const getServiceAPI = require('../serviceAPI')
const { bnToU8a } = require('@polkadot/util')

/******************************************************************************
  ROLE: Hoster
******************************************************************************/
const ROLE = __filename.split('/').pop().split('.')[0].toLowerCase()

module.exports = role

async function role ({ name, account }) {
  const log = debug(`[${name.toLowerCase()}:${ROLE}]`)
  log('Register as hoster')
  const serviceAPI = getServiceAPI()
  const chainAPI = await getChainAPI()

  await account.initHoster()
  const hosterKey = account.hoster.publicKey
  const myAddress = account.chainKeypair.address
  const signer = account.chainKeypair
  chainAPI.listenToEvents(handleEvent)
  const nonce = account.getNonce()
  await chainAPI.registerHoster({hosterKey, signer, nonce})

// EVENTS
  async function handleEvent (event) {

    if (event.method === 'NewContract') {
      const [contractID] = event.data
      const contract = await chainAPI.getContractByID(contractID)
      const hosters = contract.hosters
      hosters.forEach(async (id) => {
        const hosterAddress = await chainAPI.getUserAddress(id)
        if (hosterAddress === myAddress) {
          log('Event received:', event.method, event.data.toString())
          const { feedKey, attestorKey, plan } = await getHostingData(contract)
          const host = serviceAPI.host({account, feedKey, attestorKey, plan})
          host.then(async () => {
            const nonce = account.getNonce()
            await chainAPI.hostingStarts({contractID, signer, nonce})
          })
        }
      })
    }

    if (event.method === 'NewProofOfStorageChallenge') {
      const [challengeID] = event.data
      const challenge = await chainAPI.getChallengeByID(challengeID)
      const contract = await chainAPI.getContractByID(challenge.contract)
      const hosterID = challenge.hoster
      const hosterAddress = await chainAPI.getUserAddress(hosterID)
      if (hosterAddress === myAddress) {
        log('Event received:', event.method, event.data.toString())
        const { feed: feedID } = await chainAPI.getPlanByID(contract.plan)
        const feedKey = await chainAPI.getFeedKey(feedID)
        const data = { account, challenge, feedKey }
        const response = await serviceAPI.getProofOfStorage(data)
        // @@TODO:
        // connect to the attestor
        // send proof to the attestor
        // if all good, attestor responds ot the chain
        const nonce = account.getNonce()
        const proofs = response.map(res => res.proof)
        const opts = {challengeID, proofs, signer, nonce}
        await chainAPI.submitProofOfStorage(opts)
      }
    }
  }

  // HELPERS

  async function getHostingData (contract) {
    const ranges = contract.ranges
    // @TODO there's many encoders
    const attestorID = contract.attestor
    const attestorKey = await chainAPI.getAttestorKey(attestorID)
    const planID = contract.plan
    const { feed: feedID } = await chainAPI.getPlanByID(planID)
    const feedKey = await chainAPI.getFeedKey(feedID)
    const objArr = ranges.map( range => ({start: range[0], end: range[1]}) )
    const plan = { ranges: objArr }
    return { feedKey, attestorKey, plan }
  }


}
