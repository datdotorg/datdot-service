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

    if (event.method === 'NewStorageChallenge') {
      const [storageChallengeID] = event.data
      const storageChallenge = await chainAPI.getStorageChallengeByID(storageChallengeID)
      const contract = await chainAPI.getContractByID(storageChallenge.contract)
      const hosterID = storageChallenge.hoster
      const hosterAddress = await chainAPI.getUserAddress(hosterID)
      if (hosterAddress === myAddress) {
        log('Event received:', event.method, event.data.toString())
        const data = await getStorageChallengeData(storageChallenge, contract)
        data.account = account
        // log('sendStorageChallengeToAttestor - DATA', data)
        const sendStorageChallenge = await serviceAPI.sendStorageChallengeToAttestor(data)
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

  async function getStorageChallengeData (storageChallenge, contract) {
    const { feed: feedID } = await chainAPI.getPlanByID(contract.plan)
    const feedKey = await chainAPI.getFeedKey(feedID)
    const attestorID = storageChallenge.attestor
    const attestorKey = await chainAPI.getAttestorKey(attestorID)
    const proofs = await serviceAPI.getStorageChallenge({ account, storageChallenge, feedKey })
    return {storageChallengeID: storageChallenge.id, feedKey, attestorKey, proofs}
  }

}
