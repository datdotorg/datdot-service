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
    // getChallenges,
    // respondToChallenges,
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
    LOG(`ALICE: ${ALICE.address}`)
    LOG(`CHARLIE: ${CHARLIE.address}`)
    LOG(`FERDIE: ${FERDIE.address}`)
    LOG(`EVE: ${EVE.address}`)
    LOG(`DAVE: ${DAVE.address})`)
    const accounts = [ALICE, CHARLIE, FERDIE, EVE, DAVE]
    cb(chainAPI, serviceAPI, accounts)
  }

  // PUBLISH DATA
  async function publishData (opts) {
    const {registerPayload, account} = opts
    const registerData = API.tx.datVerify.registerData(registerPayload)
    await registerData.signAndSend(account, ({ events = [], status }) => {
      LOG(`Publishing data: ${account.address} `, status.type)
    })
  }

async function register () {

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
  const {users, respondToChallenges} = opts
  const allChallenges = await API.query.datVerify.challengeMap()
  for (var i = 0; i < users.length; i++) {
    getChallenge(users[i], allChallenges, respondingChallenges = [])
  }
  respondToChallenges(respondingChallenges)
}

async function getChallenge (user, allChallenges, respondingChallenges) {
  const userChallengeTuple = await API.query.datVerify.selectedUserIndex(user.address)
  if (userChallengeTuple[1].length) {
    const userChallengeID = userChallengeTuple[0] // this is the user's ID in the challenge context
    const userChallengePromises = await Promise.all(
      allChallenges.map(async (challengeID, j) => {
        const challengesIDs = allChallenges[1]
        if (challengesIDs[j] && challengesIDs[j] === userChallengeID) {
          const challengeTuple = await API.query.datVerify.selectedChallenges(challengeID)
          const challengeDetails = challengeTuple.toJSON()
          challengeDetails[3] = challengeID
          return challengeDetails.flat()
        }
      }
    ))
    const userChallengeUnfiltered = await Promise.all(userChallengePromises)
    const userChallenges = userChallengeUnfiltered.filter((e) => {return e})
    pushChallengeObj(userChallenges)
  }
}

function pushChallengeObj (userChallenges) {
  if (userChallenges.length) {
    for (var j = 0; j < userChallenges.length; j ++) {
      const challengeDetails = userChallenges[j]
      const challengeObj = {}
      challengeObj.user = user
      challengeObj.pubkey = challengeDetails[0]
      challengeObj.index = challengeDetails[1]
      challengeObj.deadline = challengeDetails[2]
      challengeObj.challengeIndex = challengeDetails[3]
      respondingChallenges.push(challenge)
    }
  }
}

// RESPOND TO CHALLENGE

async function respondToChallenges (opts) {
  const { challengeObjects, feeds } = opts
  for (const i in challengeObjects) {
    const challenge = challengeObjects[i]
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
