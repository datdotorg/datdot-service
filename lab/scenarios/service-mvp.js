const hypercoreArr_promise = require('../../src/temp_helpers/getHypercoreArr')
const chainAPI_promise = require('../../src/temp_helpers/chainAPI-mvp') // to use substrate node
const colors = require('colors/safe');
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
  const chainAPI = await chainAPI_promise
  const serviceAPI = {}
  makeAccount(chainAPI, serviceAPI)
}
setup()

// 2. `make ACCOUNT`
async function makeAccount(chainAPI, serviceAPI) {
  const opts = {chainAPI, serviceAPI, cb: start}
  chainAPI.makeAccount(opts)
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
      account: accounts[0],
    }
    await chainAPI.publishData(opts)
  }
  publishData()
  chainAPI.listenToEvents(handleEvent)

    /* --------------------------------------
          C. REGISTERING FLOW
    ----------------------------------------- */
    // 1. `register HOSTER`
    async function registerHoster() {
      const opts = {accounts}
      await chainAPI.registerHoster(opts)
    }

    // 2. `register ENCODER`

    // 3. `register ATTESTER`
    async function registerAttestor() {
      const opts = {accounts}
      await chainAPI.registerAttestor(opts)
    }
    /* --------------------------------------
              D. CHALLENGES FLOW
    ----------------------------------------- */
    let signer = 0
    async function submitChallenge (data) { //submitChallenge
      const userID = data[0]
      const feedID = data[1]
      const opts = { account: accounts[signer], userID, feedID}
      signer <= accounts.length - 1 ? signer ++ : signer = 0
      await chainAPI.submitChallenge(opts)
    }

    async function getChallenges (data) {
      const user = data[0]
      const opts = {user, accounts, respondToChallenges}
      await chainAPI.getChallenges(opts)
    }
    // async function getChallenges (address) {
    //   const opts = {address, respondToChallenges}
    //   await chainAPI.getChallenges(opts)
    // }

    async function respondToChallenges (responses) {
      LOG('Responding to challenges', JSON.stringify(responses))
      const feeds = (await hypercoreArr_promise)[1]
      const opts = {responses, feeds}
      await chainAPI.sendProof(opts)
    }
    /* --------------------------------------
              E. ATTEST PHASE
    ----------------------------------------- */
    async function attestPhase (data) {
      LOG('EVENT', data.toString('hex'))
      const challengeID = data[0]
      const obj = JSON.parse(data[1])
      const attestorIDs = obj['expected_attestors']
      const opts = {challengeID, attestorIDs}
      await chainAPI.attest(opts)
    }
    /* --------------------------------------
              F. EVENTS
    ----------------------------------------- */
    async function handleEvent (event) {
      const address = event.data[0]
      LOG(`New event:`, event.method, event.data.toString())
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
