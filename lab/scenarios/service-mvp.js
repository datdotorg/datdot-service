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
    const feedKey = await chainAPI.getFeedKeyByID(feedID)
    const feedKeyBuffer = Buffer.from(feedKey, 'hex')

    const hosterAddress  = await chainAPI.getUserByID(hosterID)
    const hoster = accounts[hosterAddress]
    const hosterKey = hoster.hoster.publicKey

    const encoderAddress = await chainAPI.getUserByID(encoderID)
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

  async function requestProofOfStorage (data) { // requestProofOfStorage
    const [ contractID] = data
    const { feedID, hosterID, encoderID, planID } = await chainAPI.getContractByID(contractID)
    const publisherID = await chainAPI.getPublisherByPlanID(planID)
    const publisherAddress = await chainAPI.getUserByID(publisherID)
    const account = accounts[publisherAddress]
    const nonce = getNonce(account)
    await chainAPI.requestProofOfStorage({contractID, signer: publisherAddress, nonce})
  }
  async function submitProofOfStorage (data) {
    const [challengeID] = data
    const { hosterID, feedID, chunks } = await chainAPI.getChalengeByID(challengeID)
    const feedKey = await chainAPI.getFeedKeyByID(feedID)
    const feedKeyBuffer = Buffer.from(feedKey, 'hex')
    const hosterAddress  = await chainAPI.getUserByID(hosterID)
    const user = accounts[hosterAddress]
    const proof = await Promise.all(chunks.map(async (chunk) => {
      return await user.hoster.getProofOfStorage(feedKeyBuffer, chunk)
    }))
    LOG('Submitting proof of storage to the chain', proof)
    const signer = hosterAddress
    const nonce = getNonce(user)
    await chainAPI.submitProofOfStorage({challengeID, proof, signer, nonce})
  }
  async function attestDataServing (data) {
    const [attestorID, challengeID] = data
    const { feedID } = await chainAPI.getChalengeByID(challengeID)
    const feedKey = await chainAPI.getFeedKeyByID(feedID)
    const feedKeyBuffer = Buffer.from(feedKey, 'hex')
    const attestorAddress = await chainAPI.getUserByID(attestorID)
    const user = accounts[attestorAddress]
    const randomChunks = await chainAPI.getRandomChunksForFeed(challengeID)
    const attestation = await Promise.all(randomChunks.map(async (chunk) => {
      return await user.attestor.attest(feedKeyBuffer, chunk)
    }))
    LOG('Attesting retrievability to the chain for chunks', randomChunks)
    const signer = attestorAddress
    const nonce = getNonce(user)
    await chainAPI.attestDataServing({challengeID, attestation, signer, nonce})
  }
  /* --------------------------------------
            E. EVENTS
  ----------------------------------------- */
  async function handleEvent (event) {
    // const address = event.data[0]
    LOG('New event:', event.method, event.data.toString())
    if (event.method === 'NewFeed') {}
    if (event.method === 'NewPlan') {}
    if (event.method === 'NewContract') await requestHosting(event.data)
    if (event.method === 'HostingStarted') await requestProofOfStorage(event.data)
    if (event.method === 'Proof-of-storage challenge') await submitProofOfStorage(event.data)
    if (event.method === 'Storing confirmed') attestDataServing(event.data)
  }
}
