const { Keyring } = require('@polkadot/api')
const { cryptoWaitReady } = require('@polkadot/util-crypto')
const keyring = new Keyring({ type: 'sr25519' })
const getData = require('../../src/getFeed')
const getChainAPI = require('../../src/chainAPI') // to use substrate node
const SDK = require('dat-sdk')
// const storage = require('random-access-memory')
const storage = './tmp'
const levelup = require('levelup')
const memdown = require('memdown')

const Account = require('../../src/account')
const ACCOUNTS = require('./accounts.json')
const colors = require('colors/safe')
const NAME = __filename.split('/').pop().split('.')[0].toUpperCase()
function LOG (...msgs) {
  msgs = [`[${NAME}] `, ...msgs].map(msg => colors.magenta(msg))
  console.log(...msgs)
}

/* --------------------------------------
              A. SETUP FLOW
----------------------------------------- */

// 1. Get substrate chain API
setup()

async function setup () {
  await cryptoWaitReady();
  const chainAPI = await getChainAPI()
  const serviceAPI = {}
  start(chainAPI, serviceAPI)
}

async function start (chainAPI, serviceAPI) {
  chainAPI.listenToEvents(handleEvent)
  const accounts = {}
  for(let name in ACCOUNTS) {
    const account = await makeAccount(name)
    const address = account.chainKeypair.address
    accounts[address] = account
    LOG(name, account.chainKeypair.address.toString('hex'), account.sdkIdentity.publicKey.toString('hex'))

    const nonce = await getNonce(account)
    if (ACCOUNTS[name].publisher) { await publishFeedAndPlan(account, nonce)}
    if (ACCOUNTS[name].hoster) { await registerHoster(account, nonce) }
    if (ACCOUNTS[name].encoder) { await registerEncoder(account, nonce) }
    if (ACCOUNTS[name].attestor) { await registerAttestor(account, nonce) }
  }

  async function makeAccount (name) {
    const account = await Account.load({
      persist: false,
      application: `datdot-account-${name}`
    })
    const nonce = await getNonce(account)
    const signer = account.chainKeypair.address
    await chainAPI.newUser({signer, nonce})
    return account
  }

  async function getNonce (account) {
    return account.nonce++
  }
  /* --------------------------------------
  B. REGISTERING FLOW
  ----------------------------------------- */
  async function registerHoster (account, nonce) {
    await account.initHoster()
    const signer = account.chainKeypair.address
    await chainAPI.registerHoster({signer, nonce})
  }

  async function registerEncoder (account, nonce) {
    await account.initEncoder()
    const signer = account.chainKeypair.address
    await chainAPI.registerEncoder({signer, nonce})
  }
  async function registerAttestor (account, nonce) {
    await account.initAttestor()
    const signer = account.chainKeypair.address
    await chainAPI.registerAttestor({ signer, nonce })
  }
  /* --------------------------------------
            C. COMMIT FLOW
  ----------------------------------------- */
  // 1. `publish DATA`
  async function publishFeedAndPlan (account, nonce) {
    const data = await getData(account)
    const signer = account.chainKeypair.address
    const plan = { ranges: [[0,8]] }
    await chainAPI.publishFeedAndPlan({merkleRoot: data, plan, signer, nonce})
  }

  /* --------------------------------------
            D. SERVICE FLOW
  ----------------------------------------- */

  async function requestHosting (data) {
    const [encoderID, hosterID, feedID, contractID, ranges] = data
    const feedKey = await chainAPI.getFeedKey(feedID)
    const feedKeyBuffer = Buffer.from(feedKey, 'hex')

    const hosterAddress  = await chainAPI.getUserAddress(hosterID)
    const hoster = accounts[hosterAddress]
    const hosterKey = hoster.hoster.publicKey

    const encoderAddress = await chainAPI.getUserAddress(encoderID)
    const encoder = accounts[encoderAddress]
    const encoderKey = encoder.encoder.publicKey

    const objArr = ranges.map( range => ({start: range[0], end: range[1]}) )
    const plan = { ranges: objArr }
    LOG('Publisher requested hosting for feed:', feedKey)
    LOG('Ranges:', ranges)
    LOG('Pairing hoster and encoder', hosterKey, encoderKey)

    const activateHoster = hoster.hostFeed(feedKeyBuffer, encoderKey, plan)
    activateHoster.then(async () => {
      LOG('Hosting succesfull')
      const account = accounts[hosterAddress]
      const nonce = getNonce(account)
      await chainAPI.hostingStarts({contractID, signer: hosterAddress, nonce})
    })
    const activateEncoder =  encoder.encodeFor(hosterKey, feedKeyBuffer, ranges)
    activateEncoder.then(async () => {
      const account = accounts[encoderAddress]
      const nonce = getNonce(account)
      await chainAPI.encodingDone({contractID, signer: encoderAddress, nonce})
    })
  }

  /* --------------------------------------
            E. QUALITY ASSURANCE FLOW
  ----------------------------------------- */

  async function requestProofOfStorageChallenge (data) { // requestProofOfStorageChallenge
    const [ contractID] = data
    const { hoster: hosterID, encoder: encoderID, plan: planID } = await chainAPI.getContractByID(contractID)
    const { feed: feedID } =  await chainAPI.getPlanByID(planID)
    const plan = await chainAPI.getPlanByID(planID)
    const publisherID = plan.publisher
    const publisherAddress = await chainAPI.getUserAddress(publisherID)
    const account = accounts[publisherAddress]
    const nonce = getNonce(account)
    await chainAPI.requestProofOfStorageChallenge({contractID, signer: publisherAddress, nonce})
  }
  async function submitProofOfStorage (data) {
    const [challengeID] = data
    const challenge = await chainAPI.getChallengeByID(challengeID)
    const contract = await chainAPI.getContractByID(challenge.contract)
    const { feed: feedID } = await chainAPI.getPlanByID(contract.plan)
    const feedKey = await chainAPI.getFeedKey(feedID)
    const feedKeyBuffer = Buffer.from(feedKey, 'hex')
    const hosterAddress  = await chainAPI.getUserAddress(contract.hoster)
    const user = accounts[hosterAddress]
    const proof = await Promise.all(challenge.chunks.map(async (chunk) => {
      return await user.hoster.getProofOfStorage(feedKeyBuffer, chunk)
    }))
    LOG('Proof for Challenge', challengeID)
    const signer = hosterAddress
    const nonce = getNonce(user)
    await chainAPI.submitProofOfStorage({challengeID, proof, signer, nonce})
  }
  async function requestAttestation (data) { // requestAttestation
    const [ contractID] = data
    const { hoster: hosterID, encoder: encoderID, plan: planID } = await chainAPI.getContractByID(contractID)
    const { feed: feedID } =  await chainAPI.getPlanByID(planID)
    const plan = await chainAPI.getPlanByID(planID)
    const publisherID = plan.publisher
    const publisherAddress = await chainAPI.getUserAddress(publisherID)
    const account = accounts[publisherAddress]
    const nonce = getNonce(account)
    await chainAPI.requestAttestation({contractID, signer: publisherAddress, nonce})
  }
  async function submitAttestationReport (data) {
    const [attestationID] = data
    const attestation = await chainAPI.getAttestationByID(attestationID)
    const contractID = attestation.contract
    const contract = await chainAPI.getContractByID(contractID)
    const { feed: feedID } = await chainAPI.getPlanByID(contract.plan)
    const feedKey = await chainAPI.getFeedKey(feedID)
    const feedKeyBuffer = Buffer.from(feedKey, 'hex')
    const attestorID = attestation.attestor
    const attestorAddress = await chainAPI.getUserAddress(attestorID)
    const user = accounts[attestorAddress]
    const { ranges } = await chainAPI.getPlanByID(contract.plan)
    const randomChunks = ranges.map(range => getRandomInt(range[0], range[1] + 1))
    const report = await Promise.all(randomChunks.map(async (chunk) => {
      return await user.attestor.attest(feedKeyBuffer, chunk)
    }))
    LOG('Attestation for chunks', randomChunks)
    const signer = attestorAddress
    const nonce = getNonce(user)
    await chainAPI.submitAttestationReport({attestationID, report, signer, nonce})
  }
  /* --------------------------------------
            E. HELPERS
  ----------------------------------------- */
  function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
  }
  /* --------------------------------------
            F. EVENTS
  ----------------------------------------- */
  async function handleEvent (event) {
    // const address = event.data[0]
    LOG('New event:', event.method, event.data.toString())
    if (event.method === 'NewFeed') {}
    if (event.method === 'NewPlan') {}
    if (event.method === 'NewContract') await requestHosting(event.data)
    if (event.method === 'HostingStarted') await requestProofOfStorageChallenge(event.data)
    if (event.method === 'NewProofOfStorageChallenge') await submitProofOfStorage(event.data)
    if (event.method === 'ProofOfStorageConfirmed') requestAttestation(event.data)
    if (event.method === 'newAttestation') submitAttestationReport(event.data)
    if (event.method === 'AttestationReportConfirmed') {}
  }
}
