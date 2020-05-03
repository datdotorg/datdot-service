const { ApiPromise, WsProvider, Keyring, ApiRx } = require("@polkadot/api")
const provider = new WsProvider('ws://127.0.0.1:9944')
const keyring = new Keyring({ type: 'sr25519' })
const { randomAsU8a } = require('@polkadot/util-crypto') // make sure version matches api version
const { hexToBn } = require('@polkadot/util');
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
        if (status.isInBlock) resolve()
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
          if (status.isInBlock) resolve()
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
          if (status.isInBlock) return resolve()
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
        if (status.isInBlock) resolve()
      })
    })
  }

// ATTEST PHASE

async function attest (opts) {
  return new Promise((resolve, reject) => {
    const {challengeID, attestorIDs} = opts
    LOG('Attestor IDs', attestorIDs.toString('hex'))
    attestorIDs.forEach(async id => {
      const address = await API.query.datVerify.attestors(id)
      LOG('ADDRESS', address.toString('hex'))
      const account = keyring.getPair(address.toString('hex'))
      LOG('ACCOUNT', account.toString('hex'))
      const attestation = getAttestation()
      const submit = API.tx.datVerify.submitAttestation(challengeID, attestation)
      await submit.signAndSend(account, ({ events = [], status }) => {
        LOG(`Registering hoster: ${account.address} `, status.type)
        if (status.isInBlock) resolve()
      })
    })
  })
  // get account from the challenge
  // const user = await API.query.datVerify.attestors(challengeID)
  // LOG('CHALLENGE DETAILS', challenge.toString('hex'))

}



// GET CHALLENGES
async function getChallenges (opts) {
  LOG('Getting challenges')
  const {user, accounts, respondToChallenges} = opts
  const responses = []

  // Get all challenges [key: challengeID, value: chalengedUserID ] => mapping
  const allChallenges = await API.query.datVerify.challengeMap.entries()
  // get selected user ID based on the account address
  const selectedUser = await API.query.datVerify.selectedUserIndex(user)
  const selectedUserID = selectedUser[0]

  // go through allChallenges and get out all where sellected user ID === challenged user
  for (var i = 0; i < allChallenges.length; i ++) {
    const challengeID = allChallenges[i][0]
    const chalengedUserID = allChallenges[i][1]
    if (chalengedUserID.toString('hex') === selectedUserID.toString('hex')) {
      // then get a challenge based on challenge ID
      // const challengeTuple = await API.query.datVerify.selectedChallenges(challengeID)
      const parsedChallengeID = getHexToBn(challengeID)
      const challenge = await API.query.datVerify.selectedChallenges(parsedChallengeID)
      // prepare response object
      const response = {
        user,
        pubkey: challenge.toJSON().flat()[0],
        index: challenge.toJSON().flat()[1],
        deadline: challenge.toJSON().flat()[2],
        parsedChallengeID
      }
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
    const { user, deadline, parsedChallengeID } = challenge
    const feed = feeds[pubkey]
    feed.seek(challenge.index, step1)

    async function step1 (err, offsetIndex, offset) {
      const index = offsetIndex
      if (err) {
        LOG(`Failed to complete challenge for chunk: ${(index||'').toString()}/${feed.length}`)
        return LOG('Reason: ', err)
      }
      feed.get(index, async (err, chunk) => {
        if (err) {
          LOG(`Failed to get index: ${index} in ${feed}`)
          return LOG('Reason: ', err)
        }
        const proof = API.tx.datVerify.submitProof(parsedChallengeID, [])
        const account = keyring.getPair(user.toString('hex'))
        // await promiseRerun(proof.signAndSend(account, step2)).catch(LOG)
        proof.signAndSend(account, step2)
      })
    }
    async function step2 ({ events = [], status }) {
      LOG('STATUS', status.type)
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

function getHexToBn (val) {
  return hexToBn(val.toString('hex').substring(82), { isLe: true }).toNumber()
}

function getAttestation () {
  const location = 0
  const latency = 0
  return [location, latency]
}

}