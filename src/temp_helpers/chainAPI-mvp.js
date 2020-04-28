const { ApiPromise, WsProvider, Keyring, ApiRx } = require("@polkadot/api")
const provider = new WsProvider('ws://127.0.0.1:9944')
const { randomAsU8a } = require('@polkadot/util-crypto') // make sure version matches api version
const fs = require('fs')
const crypto = require('hypercore-crypto')
const path = require('path')
const filename = path.join(__dirname, '../../src/types.json')
const types = JSON.parse(fs.readFileSync(filename).toString())

const colors = require('colors/safe');
const NAME = __filename.split('/').pop().split('.')[0].toUpperCase()
function LOG (...msgs) {
  msgs = [`[${NAME}] `, ...msgs].map(msg => colors.blue(msg))
  console.log(...msgs)
}

module.exports = new Promise(datdotChain)



async function datdotChain (resolve, reject) {

  function rerun (promiseFn, maxTries = 20, counter = 0, delay = 100) {
    return new Promise ((resolve, reject) => {
      getPromise()
      async function getPromise () {
        try {
          const chain = await promiseFn()
          resolve(chain)
        } catch (error) {
          counter += 1
          if (counter < maxTries) return setTimeout(getPromise, delay)
          LOG('error - promise rejected', e)
          reject(error)
        }
      }
    })
  }

  // const API = await ApiPromise.create({ provider,types })
  const API = await rerun(() => ApiPromise.create({ provider,types }))
  const chainAPI = {
    makeAccount,
    registerHoster,
    registerAttestor,
    publishData,
    submitChallenge,
    getChallenges,
    sendProof,
    attest,
    listenToEvents
  }
  resolve(chainAPI)
  function makeAccount (opts) {
    const {chainAPI, serviceAPI, cb} = opts
    const keyring = new Keyring({ type: 'sr25519' })
    // const account = keyring.addFromSeed(randomAsU8a(32))
    const ALICE = keyring.addFromUri('//Alice')
    const CHARLIE = keyring.addFromUri('//Charlie')
    const FERDIE = keyring.addFromUri('//Ferdie')
    const EVE = keyring.addFromUri('//Eve')
    const DAVE = keyring.addFromUri('//Dave')
    LOG(`CHARLIE: ${CHARLIE.address}`)
    LOG(`FERDIE: ${FERDIE.address}`)
    LOG(`EVE: ${EVE.address}`)
    LOG(`DAVE: ${DAVE.address})`)
    const accounts = [ALICE, CHARLIE, FERDIE, EVE, DAVE]
    cb(chainAPI, serviceAPI, accounts)
  }

  // PUBLISH DATA
  async function publishData (opts) {
    return new Promise(async (resolve, reject) => {
      const {registerPayload, account} = opts
      const registerData = API.tx.datVerify.registerData(registerPayload)
      await registerData.signAndSend(account, ({ events = [], status }) => {
        LOG(`Publishing data: ${account.address} `, status.type)
        if (status.isFinalized) resolve()
      })
    })
  }

// REGISTER HOSTER
  async function registerHoster (opts) {
    return new Promise((resolve, reject) => {
      const {accounts} = opts
      accounts.forEach(async account => {
        const register = API.tx.datVerify.registerSeeder()
        await register.signAndSend(account, ({ events = [], status }) => {
          LOG(`Registering hoster: ${account.address} `, status.type)
          if (status.isFinalized) resolve()
        })
      })
    })
  }

  // REGISTER ATTESTOR
  async function registerAttestor (opts) {
    return new Promise((resolve, reject) => {
      const {accounts} = opts
      accounts.forEach(async account => {
        const register = API.tx.datVerify.registerAttestor()
        await register.signAndSend(account, ({ events = [], status }) => {
          LOG(`Registering attestor: ${account.address} `, status.type)
          if (status.isFinalized) return resolve()
        })
      })
    })
  }

  // REQUEST A CHALLENGE
  async function submitChallenge (opts) {
    return new Promise(async (resolve, reject) => {
      const {account, userID, feedID} = opts // userID index, dat index
      LOG('Requesting a new challenge')
      const challenge = API.tx.datVerify.submitChallenge(userID, feedID)
      await challenge.signAndSend(account, ({ events = [], status }) => {
        LOG(`Requesting a new challenge: ${userID.toString('hex')}, ${feedID.toString('hex')} `, status.type)
        if (status.isFinalized) resolve()
      })
    })
  }

// ATTEST PHASE

async function attest (opts) {
  const {account} = opts
  LOG('Attest phase started')
  const submit = API.tx.datVerify.submitAttestation()
  await submit.signAndSend(account, ({ events = [], status }) => {
    LOG(`Registering hoster: ${account.address} `, status.type)
    if (status.isFinalized) resolve()
  })

}



// GET CHALLENGES
async function getChallenges (opts) {
  LOG('Getting challenges')
  const {user, accounts, respondToChallenges} = opts
  const responses = []

  // Get challenges [all challenge ids, all sellected user ids] => mapping
  const allChallenges = await API.query.datVerify.challengeMap.entries()
  // key: challengeID
  // value: sellectedUserID

  // get all sellectedUserIDs
  const sellectedUserIDs = Object.keys(allChallenges)
  LOG('sellectedUserIDs', sellectedUserIDs.toString('hex'))

  // get challenged user ID
  const challengedUser = await API.query.datVerify.selectedUserIndex(user)
  const challengedUserID = challengedUser[0]
  LOG('challengedUserID', challengedUserID.toString('hex'))


  // go through sellectedUserIDs and get out all where sellected user ID === challenged user
  for (var i = 0; i < allChallenges.length; i ++) {
    const challengeID = allChallenges[i][0]
    LOG('challengeID', challengeID.toString('hex'))

    const sellectedUserID = allChallenges[i][1]
    if (sellectedUserID.toString('hex') === challengedUserID.toString('hex')) {

      // then get a challenge based on challenge ID
      // const challengeTuple = await API.query.datVerify.selectedChallenges(challengeID)
      const challenge = await API.query.datVerify.selectedChallenges(challengeID)
      LOG('challenge', challenge.toString('hex'))

      const challengeDetails = challenge.toJSON()
      challengeDetails[3] = challengeID
      LOG('challengeDetails', challengeDetails.toString('hex'))

      const flattenDetails = challengeDetails.flat()
      LOG('flattenDetails', flattenDetails.toString('hex'))

      // prepare challenge response for each challenge
      const response = { }
      response.user = user
      response.pubkey = flattenDetails[0]
      response.index = flattenDetails[1]
      response.deadline = flattenDetails[2]
      response.challengeIndex = challengeID
      LOG('Response:', JSON.stringify(response))

      // push to all responses
      responses.push(response)
    }
  }
  respondToChallenges(responses)
}

// RESPOND TO CHALLENGE

async function sendProof (opts) {
  const { responses, feeds } = opts
  for (var i = 0; i < responses.length; i++) {
    const challenge = responses[i]
    const pubkey = challenge.pubkey.slice(2)
    const { user, deadline, challengeIndex } = challenge
    const feed = feeds[pubkey]
    feed.seek(challenge.index, step1)

    async function step1 (err, offsetIndex, offset) {
      if (err) {
        LOG(`Failed to complete challenge for chunk: ${(offsetIndex||'').toString()}/${feed.length}`)
        return LOG('Reason: ', err)
      }
      feed.rootHashes(offsetIndex, step2)
    }
    async function step2 (err, roots) {
      if (err) {
        LOG(`Failed to get merkle tree: ${roots}`)
        return LOG('Reason: ', err)
      }
      feed.get(index, (err, chunk) => {
        if (err) {
          LOG(`Failed to get index: ${index} in ${feed}`)
          return LOG('Reason: ', err)
        }
        LOG('CHUNK: ' + chunk.toString('hex'))
        feed.proof(index, (err, nodes) => {
          if (err) {
            LOG(`Failed to get proof for: ${index} in ${feed}`)
            return LOG('Reason: ', err)
          }
          step3(chunk, nodes, crypto.tree(roots))
        })
      })
    }
    async function step3 (chunk, nodes, merkleRoot) {
      if (nodes && chunk) {
        const challengeResponseExt = API.tx.datVerify.submitProof(challengeIndex, nodes, merkleRoot, chunk.toString('hex'))
        await promiseRerun(challengeResponseExt.signAndSend(user, step4)).catch(LOG)
      }
    }
    async function step4 ({ events = [], status }) {
      LOG('Challenge succesfully responded')
      if (status.isInBlock) events.forEach(({ phase, event: { data, method, section } }) => {
        LOG('\t', phase.toString(), `: ${section}.${method}`, data.toString())
      })
    }
  }
}

// LISTEN TO EVENTS

async function listenToEvents (handleEvent) {
  const unsub = API.query.system.events((events) => {
    events.forEach(async (record) => {
      const event = record.event
      handleEvent(event)
    })
  })
}

// HELPERS

async function promiseRerun (promise) {
  var success = true
  do {
    return promise.catch((e) => {
      success = false
      console.error(e)
      console.log('Retrying!')
    })
  } while (!success)
}

}
