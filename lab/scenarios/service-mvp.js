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
  msgs = [`[${NAME}] `, ...msgs].map(msg => colors.green(msg))
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

// 2. `make ACCOUNT`
// function makeAccount (name) {
//   return keyring.addFromUri(name)
// }


async function start (chainAPI, serviceAPI) {

  chainAPI.listenToEvents(handleEvent)
  const accounts = {}
  for(let name in ACCOUNTS) {
    const account = await makeAccount(name)
    accounts[account.chainKeypair.address] = account
    LOG(name, account.sdkIdentity.publicKey.toString('hex'))

    const nonce = await getNonce(account)
    if (ACCOUNTS[name].publisher) { await registerData(account, nonce)}
    if (ACCOUNTS[name].hoster) { await registerHoster(account, nonce) }
    if (ACCOUNTS[name].encoder) { await registerEncoder(account, nonce) }
    if (ACCOUNTS[name].attester) { await registerAttestor(account, nonce) }
  }

  async function makeAccount (name) {
    return Account.load({
      persist: false,
      application: `datdot-account-${name}`
    })
  }

  async function getNonce (account) {
    return account.nonce++
  }
  /* --------------------------------------
            B. COMMIT FLOW
  ----------------------------------------- */
  // 1. `publish DATA`
  async function registerData (account, nonce) {
    const data = await getData(account)
    account = account.chainKeypair
    await chainAPI.registerData({merkleRoot: data, account, nonce})
  }

  /* --------------------------------------
        C. REGISTERING FLOW
  ----------------------------------------- */
  async function registerHoster (account, nonce) {
    await account.initHoster()
	  await chainAPI.registerHoster({account: account.chainKeypair})
  }

  async function registerEncoder (account, nonce) {
    await account.initEncoder()
    await chainAPI.registerEncoder({account: account.chainKeypair, nonce})
  }
  async function registerAttestor (account, nonce) {
    await chainAPI.registerAttestor({ account: account.chainKeypair, nonce })
  }
  /* --------------------------------------
            D. SERVICE FLOW
  ----------------------------------------- */

  async function requestHosting (data) {
    LOG('Request Hosting event data')
    const [encoderID, hosterID, datID] = data
    const { archive_pubkey } = await chainAPI.getArchive(datID)
    var { address: hosterAddress } = await chainAPI.getUser(hosterID)
    var { address: encoderAddress } = await chainAPI.getUser(encoderID)

    const hoster = accounts[hosterAddress]
    const hosterKey = hoster.hoster.publicKey

    const encoder = accounts[encoderAddress]
    const encoderKey = encoder.encoder.publicKey

    const ranges = [{ start: 0, end: 1 }, { start: 2, end: 3 }]
    // @TODO for some reason doesn't work with more ranges (for example 1, 2)
    // Plus if we have more newPin events, it triggers this function many time and maybe messes things up
    const plan = { ranges }
    LOG('Publisher requested hosting for', archive_pubkey)
    LOG('Pairing hoster and encoder', hosterKey, encoderKey)


    const activateHoster = hoster.hostFeed(archive_pubkey, encoderKey, plan)
    activateHoster.then(() => {
      LOG('Hosting succesfull')
    //   // const index = await chainAPI.getEncodedIndex(encoderAddress)
    //   // LOG('Index', index)
    //   // const opts = {account: hosterKey, archive: datID, index}
    //   // chainAPI.confirmHosting(opts)
    })
    const activateEncoder =  encoder.encodeFor(hosterKey, archive_pubkey, ranges)
    activateEncoder.then(() => {
      LOG('Encoding succesfull')
      // registerEncoding for each range
      // plan.ranges.forEach(range => {
      //   const opts = {
      //     account: encoderKey,
      //     hosterID,
      //     datID,
      //     start: range.start,
      //     end: range.end}
      //   chainAPI.registerEncoding(opts)
      // })
    })

    // end of Mauve's code
  }


  let signer = 0
  async function submitChallenge (data) { // submitChallenge
    const [userID, feedID ] = data
    const opts = { account: accounts[signer], userID, feedID }
    signer <= accounts.length - 1 ? signer++ : signer = 0
    await chainAPI.submitChallenge(opts)
  }

  // async function getChallenges (data) {
  //   // data should be now (selected_user_key, dat_pubkey)
  //   const user = data[0]
  //   const opts = { user, accounts, respondToChallenges }
  //   const responses = await chainAPI.getChallenges(opts)
  //   await respondToChallenges(responses)
  // }
  //
  // async function respondToChallenges (responses) {
  //   const feeds = (await getData)[1]
  //   const opts = { responses, feeds, keyring }
  //   await chainAPI.submitProof(opts)
  // }

  async function submitProof (data) {
    await chainAPI.submitProof({ data, accounts })
  }

  async function attestPhase (data) {
    LOG('Attest phase event data', data.toString('hex'))
    const [challengeID, attestorIDs ] = data
    const opts = { challengeID, attestorIDs, keyring }
    await chainAPI.attest(opts)
  }
  /* --------------------------------------
            E. EVENTS
  ----------------------------------------- */
  counter = 0
  async function handleEvent (event) {
    const address = event.data[0]
    LOG('New event:', event.method, event.data.toString())
    if (event.method === 'SomethingStored') {
      // await registerAttestor()
      // await registerEncoder()
      // await registerHoster()
    }
    if (event.method === 'NewPin') {
      await requestHosting(event.data)
    }
    if (event.method === 'HostingStarted') {
      await submitChallenge(event.data)
    }
    if (event.method === 'Challenge') submitProof(event.data)
    if (event.method === 'ChallengeFailed') { }
    if (event.method === 'AttestPhase') attestPhase(event.data)
  }
}
