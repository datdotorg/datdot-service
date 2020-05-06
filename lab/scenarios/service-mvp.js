const { Keyring } = require('@polkadot/api')
const keyring = new Keyring({ type: 'sr25519' })
const hypercoreArr_promise = require('../../src/temp_helpers/getHypercoreArr')
const getChainAPI = require('../../src/temp_helpers/chainAPI-mvp') // to use substrate node
const colors = require('colors/safe')
const NAME = __filename.split('/').pop().split('.')[0].toUpperCase()
function LOG (...msgs) {
  msgs = [`[${NAME}] `, ...msgs].map(msg => colors.green(msg))
  console.log(...msgs)
}

/*
Scenario:
1. Create ACCOUNTS
2. Publish DATA
3. Wait for event log (if Something Stored, then ->)
4. Register HOSTERS

Behavior:
- NeWPin event logs always same account addres, but correct hypercore key
- SomethingStored could be renamed to NewPublishedData / DataPublished / PublishSucceeded?
*/

/* --------------------------------------
              A. SETUP FLOW
----------------------------------------- */

// 1. Get substrate chain API
async function setup () {
  const chainAPI = await getChainAPI()
  const serviceAPI = {}
  const names = ['//Alice', '//Charlie', '//Ferdie', '//Eve', '//Dave']
  const accounts = []
  for (var i = 0; i < names.length; i++) {
    const name = names[i]
    const account = makeAccount(name)
    accounts.push(account)
    account.name = name.split('//')[1]
    LOG(name, account.address)
  }
  if (names.length === accounts.length) start(chainAPI, serviceAPI, accounts)
}
setup()

// 2. `make ACCOUNT`
function makeAccount (name) {
  return keyring.addFromUri(name)
}

async function start (chainAPI, serviceAPI, accounts) {
  /* --------------------------------------
            B. COMMIT FLOW
  ----------------------------------------- */
  // 1. `publish DATA`
  async function publishData () {
    const hypercoreArr = (await hypercoreArr_promise)[0]
    const opts = {
      registerPayload: hypercoreArr,
      account: accounts[0]
    }
    await chainAPI.publishData(opts)
  }
  publishData()
  chainAPI.listenToEvents(handleEvent)

  /* --------------------------------------
        C. REGISTERING FLOW
  ----------------------------------------- */
  // 1. `register HOSTER`
  async function registerHoster () {
    for(let account of accounts) {
	    await chainAPI.registerHoster({account})
    }
  }

  // 2. `register ENCODER`

  // 3. `register ATTESTER`
  async function registerAttestor () {
    for (const account of accounts) {
      await chainAPI.registerAttestor({ account })
    }
  }
  /* --------------------------------------
            D. CHALLENGES FLOW
  ----------------------------------------- */
  let signer = 0
  async function submitChallenge (data) { // submitChallenge
    const userID = data[0]
    const feedID = data[1]
    const opts = { account: accounts[signer], userID, feedID }
    signer <= accounts.length - 1 ? signer++ : signer = 0
    await chainAPI.submitChallenge(opts)
  }

  async function getChallenges (data) {
    const user = data[0]
    const opts = { user, accounts, respondToChallenges }
    const responses = await chainAPI.getChallenges(opts)
    await respondToChallenges(responses)
  }

  async function respondToChallenges (responses) {
    const feeds = (await hypercoreArr_promise)[1]
    const opts = { responses, feeds, keyring }
    await chainAPI.sendProof(opts)
  }

  async function attestPhase (data) {
    LOG('EVENT', data.toString('hex'))
    const challengeID = data[0]
    const obj = JSON.parse(data[1])
    const attestorIDs = obj.expected_attestors
    const opts = { challengeID, attestorIDs, keyring }
    await chainAPI.attest(opts)
  }
  /* --------------------------------------
            E. EVENTS
  ----------------------------------------- */
  async function handleEvent (event) {
    const address = event.data[0]
    LOG('New event:', event.method, event.data.toString())
    if (event.method === 'SomethingStored') {
      await registerAttestor()
      await registerHoster()
    }
    if (event.method === 'NewPin') await submitChallenge(event.data)
    if (event.method === 'Challenge') getChallenges(event.data)
    if (event.method === 'ChallengeFailed') { }
    if (event.method === 'AttestPhase') attestPhase(event.data)
  }
}
