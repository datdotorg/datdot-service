const debug = require('debug')
const getChainAPI = require('../chainAPI')
const getServiceAPI = require('../serviceAPI')

/******************************************************************************
  ROLE: Encoder
******************************************************************************/
const ROLE = __filename.split('/').pop().split('.')[0].toLowerCase()

module.exports = role

async function role ({ name, account }) {
  const log = debug(`[${name.toLowerCase()}:${ROLE}]`)

  const serviceAPI = getServiceAPI()
  const chainAPI = await getChainAPI()
  log('Register as encoder')
  await account.initEncoder()
  const encoderKey = account.encoder.publicKey
  const myAddress = account.chainKeypair.address
  const signer = account.chainKeypair
  chainAPI.listenToEvents(handleEvent)
  const nonce = await account.getNonce()
  await chainAPI.registerEncoder({ encoderKey, signer, nonce })

  // EVENTS
  async function handleEvent (event) {
    if (event.method === 'NewContract') {
      const [contractID] = event.data
      const contract = await chainAPI.getContractByID(contractID)
      const encoders = contract.encoders
      encoders.forEach(async (id) => {
        const encoderAddress = await chainAPI.getUserAddress(id)
        if (encoderAddress === myAddress) {
          log('Event received:', event.method, event.data.toString())
          const { attestorKey, feedKey, ranges } = await getHostingData(contract)
          const encode = serviceAPI.encode({ account, attestorKey, feedKey, ranges })
          encode.then(async () => {
            const nonce = await account.getNonce()
            await chainAPI.encodingDone({ contractID, signer, nonce })
          })
        }
      })
    }
  }

  // HELPERS

  async function getHostingData (contract) {
    const ranges = contract.ranges
    const planID = contract.plan
    const { feed: feedID } = await chainAPI.getPlanByID(planID)
    const feedKey = await chainAPI.getFeedKey(feedID)
    const attestorID = contract.attestor
    const attestorKey = await chainAPI.getAttestorKey(attestorID)
    return { attestorKey, feedKey, ranges }
  }
}
