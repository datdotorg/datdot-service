const debug = require('debug')
const getChainAPI = require('../chainAPI')
const getServiceAPI = require('../serviceAPI')


/******************************************************************************
  ROLE: Attestor
******************************************************************************/
const NAME = __filename.split('/').pop().split('.')[0].toLowerCase()

module.exports = role

async function role ({ name, account }) {
  const log = debug(`[${name.toLowerCase()}:${NAME}]`)

  const serviceAPI = getServiceAPI()
  const chainAPI = await getChainAPI()
  chainAPI.listenToEvents(handleEvent)

  await account.initAttestor()
  const myAddress = account.chainKeypair.address
  const nonce = account.getNonce()
  await chainAPI.registerAttestor({signer: myAddress, nonce})

  // EVENTS
  async function handleEvent (event) {

    if (event.method === 'newAttestation'){
      const [attestationID] = event.data
      const attestation = await chainAPI.getAttestationByID(attestationID)
      const attestorID = attestation.attestor
      const attestorAddress = await chainAPI.getUserAddress(attestorID)
      if (attestorAddress === myAddress) {
        log('Event received:', event.method, event.data.toString())
        const contractID = attestation.contract
        const contract = await chainAPI.getContractByID(contractID)
        const { feed: feedID } = await chainAPI.getPlanByID(contract.plan)
        const feedKey = await chainAPI.getFeedKey(feedID)
        const feedKeyBuffer = Buffer.from(feedKey, 'hex')
        const { ranges } = await chainAPI.getPlanByID(contract.plan)
        const randomChunks = ranges.map(range => getRandomInt(range[0], range[1] + 1))
        const data = { account, randomChunks, feedKeyBuffer }
        const report = await serviceAPI.attest(data)
        const nonce = account.getNonce()
        await chainAPI.submitAttestationReport({attestationID, report, signer: myAddress, nonce})
      }
    }
  }

  // HELPERS

  function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
  }

}
