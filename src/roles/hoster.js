const debug = require('debug')
const getChainAPI = require('../chainAPI')
const getServiceAPI = require('../serviceAPI')
const getChatAPI = require('../../lab/scenarios/chatAPI')

/******************************************************************************
  ROLE: Hoster
******************************************************************************/
const ROLE = __filename.split('/').pop().split('.')[0].toLowerCase()

module.exports = role

async function role (profile, APIS) {
  const { name, account, log } = profile
  const { serviceAPI, chainAPI, chatAPI } = APIS

  log('Register as hoster')
  await chainAPI.listenToEvents(handleEvent)
  await account.initHoster({}, log)
  const hosterKey = account.hoster.publicKey
  const myAddress = account.chainKeypair.address
  const signer = account.chainKeypair
  const nonce = account.getNonce()
  await chainAPI.registerHoster({ hosterKey, signer, nonce })

  // EVENTS
  async function isForMe (peerids) {
    for (var i = 0, len = peerids.length; i < len; i++) {
      const id = peerids[i]
      const peerAddress = await chainAPI.getUserAddress(id)
      if (peerAddress === myAddress) return true
    }
  }
  async function handleEvent (event) {
    if (event.method === 'NewContract') {
      const [contractID] = event.data
      const contract = await chainAPI.getContractByID(contractID)
      const hosters = contract.hosters
      log('contract.hosters', hosters)
      if (!await isForMe(hosters)) return
      console.log('=====[NEW CONTRACT]=====')
      log('Event received:', event.method, event.data.toString())
      const { feedKey, attestorKey, plan } = await getHostingData(contract)
      console.log('@TODO: hoster')
      // await serviceAPI.host({ contractID, account, hosterKey, feedKey, attestorKey, plan })
      // const nonce = account.getNonce()
      // await chainAPI.hostingStarts({ contractID, signer, nonce })
    }

    if (event.method === 'NewStorageChallenge') {
      const [storageChallengeID] = event.data
      const storageChallenge = await chainAPI.getStorageChallengeByID(storageChallengeID)
      const contract = await chainAPI.getContractByID(storageChallenge.contract)
      const hosterID = storageChallenge.hoster
      const hosterAddress = await chainAPI.getUserAddress(hosterID)
      if (hosterAddress === myAddress) {
        console.log('=====[NEW STORAGE CHALLENGE]=====')
        log('Event received:', event.method, event.data.toString())
        // const data = await getStorageChallengeData(storageChallenge, contract)
        // data.account = account
        // data.hosterKey = hosterKey
        // // log('sendStorageChallengeToAttestor - DATA', data)
        // await serviceAPI.sendStorageChallengeToAttestor(data)
      }
    }
  }

  // HELPERS

  async function getHostingData (contract) {
    const ranges = contract.ranges
    const attestorID = contract.attestor
    const attestorKey = await chainAPI.getAttestorKey(attestorID)
    const feedID = contract.feed
    const feedKey = await chainAPI.getFeedKey(feedID)
    const objArr = ranges.map(range => ({ start: range[0], end: range[1] }))
    const plan = { ranges: objArr }
    return { feedKey, attestorKey, plan }
  }

  async function getStorageChallengeData (storageChallenge, contract) {
    const feedID = contract.feed
    const feedKey = await chainAPI.getFeedKey(feedID)
    const attestorID = storageChallenge.attestor
    const attestorKey = await chainAPI.getAttestorKey(attestorID)
    const proof = await serviceAPI.getStorageChallenge({ account, storageChallenge, feedKey })
    return { storageChallengeID: storageChallenge.id, feedKey, attestorKey, proof }
  }
}
