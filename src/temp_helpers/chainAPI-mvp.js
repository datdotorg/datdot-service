const { ApiPromise, WsProvider, Keyring, ApiRx } = require('@polkadot/api')
const provider = new WsProvider('ws://127.0.0.1:9944')
const { randomAsU8a } = require('@polkadot/util-crypto') // make sure version matches api version
const { hexToBn } = require('@polkadot/util')
const fs = require('fs')
const crypto = require('hypercore-crypto')
const path = require('path')
const filename = path.join(__dirname, '../../src/types.json')
const types = JSON.parse(fs.readFileSync(filename).toString())

const colors = require('colors/safe')
const NAME = __filename.split('/').pop().split('.')[0].toUpperCase()
function LOG (...msgs) {
  msgs = [`[${NAME}] `, ...msgs].map(msg => colors.blue(msg))
  console.log(...msgs)
}

module.exports = new Promise(datdotChain)

async function datdotChain (resolve, reject) {
  // const API = await ApiPromise.create({ provider,types })
  const API = await rerun(() => ApiPromise.create({ provider, types }))
  const chainAPI = {
    publishData,
    registerHoster,
    registerAttestor,
    submitChallenge,
    getChallenges,
    sendProof,
    attest,
    listenToEvents
  }
  resolve(chainAPI)

  // PUBLISH DATA
  async function publishData (opts) {
    return new Promise(async (resolve, reject) => {
      const { registerPayload, account, nonces } = opts
      const registerData = await API.tx.datVerify.registerData(registerPayload)
      const nonce = nonces[account.name]++
      await registerData.signAndSend(account, { nonce }, ({ events = [], status }) => {
        LOG(`Publishing data: ${account.name} `, status.type)
        if (status.isInBlock) resolve()
      })
    })
  }

  // REGISTER HOSTER
  async function registerHoster (opts) {
    return new Promise((resolve, reject) => {
      const { accounts, nonces } = opts
      accounts.forEach(async account => {
        const register = await API.tx.datVerify.registerSeeder()
        const nonce = nonces[account.name]++
        await register.signAndSend(account, { nonce }, ({ events = [], status }) => {
          LOG(`Registering hoster: ${account.name} `, status.type)
          if (status.isInBlock) resolve()
        })
      })
    })
  }

  // REGISTER ATTESTOR
  async function registerAttestor (opts) {
    return new Promise((resolve, reject) => {
      const { accounts, nonces } = opts
      accounts.forEach(async account => {
        const register = await API.tx.datVerify.registerAttestor()
        const nonce = nonces[account.name]++
        await register.signAndSend(account, { nonce }, ({ events = [], status }) => {
          LOG(`Registering attestor: ${account.name} `, status.type)
          if (status.isInBlock) return resolve()
        })
      })
    })
  }

  // REQUEST A CHALLENGE
  async function submitChallenge (opts) {
    return new Promise(async (resolve, reject) => {
      const { account, userID, feedID, nonces } = opts // userID index, dat index
      const challenge = await API.tx.datVerify.submitChallenge(userID, feedID)
      const nonce = nonces[account.name]++
      await challenge.signAndSend(account, { nonce }, ({ events = [], status }) => {
        LOG(`Requesting a new challenge: ${userID.toString('hex')}, ${feedID.toString('hex')} `, status.type)
        if (status.isInBlock) resolve()
      })
    })
  }

  // ATTEST PHASE
  async function attest (opts) {
    return new Promise((resolve, reject) => {
      const { challengeID, attestorIDs, keyring, nonces } = opts
      LOG('Attestor IDs', attestorIDs.toString('hex'))
      attestorIDs.forEach(async id => {
        const address = await API.query.datVerify.attestors(id)
        const account = keyring.getPair(address.toString('hex'))
        const attestation = getAttestation()
        const submit = await API.tx.datVerify.submitAttestation(challengeID, attestation)
        const nonce = nonces[account.name]++
        await submit.signAndSend(account, { nonce }, ({ events = [], status }) => {
          LOG(`Sending attestation: ${address.toString('hex')} `, status.type)
          if (status.isInBlock) resolve()
        })
      })
    })
  }

  // GET CHALLENGES
  async function getChallenges (opts) {
    LOG('Getting challenges')
    const { user, accounts, respondToChallenges, nonces } = opts
    const responses = []
    // Get all challenges [key: challengeID, value: chalengedUserID ] => mapping
    const allChallenges = await API.query.datVerify.challengeMap.entries()
    // get selected user ID based on the account address
    const selectedUser = await API.query.datVerify.selectedUserIndex(user)
    const selectedUserID = selectedUser[0]
    // go through allChallenges and get out all where sellected user ID === challenged user
    for (var i = 0; i < allChallenges.length; i++) {
      const challengeID = allChallenges[i][0]
      const chalengedUserID = allChallenges[i][1]
      if (chalengedUserID.toString('hex') === selectedUserID.toString('hex')) {
        // then get a challenge based on challenge ID
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
    const { responses, feeds, keyring, nonces } = opts
    for (var i = 0; i < responses.length; i++) {
      const challenge = responses[i]
      const pubkey = challenge.pubkey.slice(2)
      const { user, deadline, parsedChallengeID } = challenge
      const feed = feeds[pubkey]
      feed.seek(challenge.index, step1)

      async function step1 (err, offsetIndex, offset) {
        const index = offsetIndex
        if (err) {
          LOG(`Failed to complete challenge for chunk: ${(index || '').toString()}/${feed.length}`)
          return LOG('Reason: ', err)
        }
        feed.get(index, async (err, chunk) => {
          if (err) {
            LOG(`Failed to get index: ${index} in ${feed}`)
            return LOG('Reason: ', err)
          }
          const proof = await API.tx.datVerify.submitProof(parsedChallengeID, [])
          const account = keyring.getPair(user.toString('hex'))
          const nonce = nonces[account.name]++
          proof.signAndSend(account, { nonce }, step2)
        })
      }
      async function step2 ({ events = [], status }) {
        if (status.isInBlock) {
          events.forEach(({ phase, event: { data, method, section } }) => {
            LOG('\t', phase.toString(), `: ${section}.${method}`, data.toString())
          })
        }
      }
    }
  }

  // LISTEN TO EVENTS
  async function listenToEvents (handleEvent) {
    const unsub = await API.query.system.events((events) => {
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

  function rerun (promiseFn, maxTries = 20, counter = 0, delay = 100) {
    return new Promise((resolve, reject) => {
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
}
