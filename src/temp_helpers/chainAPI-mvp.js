const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api')
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

module.exports = datdotChain

async function datdotChain () {
  // const API = await ApiPromise.create({ provider,types })
  const API = await rerun(() => ApiPromise.create({ provider, types }))
  const nonces = {}
  const chainAPI = {
    nonces,
    publishData,
    registerHoster,
    registerAttestor,
    submitChallenge,
    getChallenges,
    sendProof,
    attest,
    listenToEvents
  }

  return chainAPI

  function getNonce(account) {
		const {name} = account
		let nonce = (nonces[name] || 0)
		nonce++
		nonces[name] = nonce

		return nonce - 1
  }

  // PUBLISH DATA
  async function publishData ({ registerPayload, account }) {
    const registerData = await API.tx.datVerify.registerData(registerPayload)
    const nonce = await getNonce(account)
    LOG(`Publishing data: ${account.name} ${nonce}`)
    await registerData.signAndSend(account, { nonce })
  }

  // REGISTER HOSTER
  async function registerHoster ({ account }) {
    const register = await API.tx.datVerify.registerSeeder()
    const nonce = await getNonce(account)
    LOG(`Registering hoster: ${account.name} ${nonce}`)
    await register.signAndSend(account, { nonce })
  }

  // REGISTER ATTESTOR
  async function registerAttestor ({ account }) {
    const register = await API.tx.datVerify.registerAttestor()
    const nonce = await getNonce(account)
    LOG(`Registering attestor: ${account.name} ${nonce}`)
    await register.signAndSend(account, { nonce })
  }

  // REQUEST A CHALLENGE
  async function submitChallenge ({ account, userID, feedID }) {
    const challenge = await API.tx.datVerify.submitChallenge(userID, feedID)
    const nonce = await getNonce(account)
    LOG(`Requesting a new challenge: ${userID.toString('hex')}, ${feedID.toString('hex')}`)
    await challenge.signAndSend(account, { nonce })
  }

  // ATTEST PHASE
  async function attest ({ challengeID, attestorIDs, keyring }) {
    LOG('Attestor IDs', attestorIDs.toString('hex'))
    await Promise.all(attestorIDs.map(async id => {
      const address = await API.query.datVerify.attestors(id)
      // TODO: Account for when attestors are on remote machines
      const account = keyring.getPair(address.toString('hex'))
      const attestation = await getAttestation()
      const submit = await API.tx.datVerify.submitAttestation(challengeID, attestation)
      const nonce = await getNonce(account)
      LOG(`Sending attestation: ${address.toString('hex')}`)
      await submit.signAndSend(account, { nonce })
    }))
  }

  // GET CHALLENGES
  async function getChallenges ({ user }) {
    LOG('Getting challenges')

    // Get all challenges [key: challengeID, value: chalengedUserID ] => mapping
    const allChallenges = await API.query.datVerify.challengeMap.entries()

    // get selected user ID based on the account address
    const selectedUser = await API.query.datVerify.selectedUserIndex(user)
    const selectedUserID = selectedUser[0]

    // go through allChallenges and get out all where sellected user ID === challenged user
    return Promise.all(allChallenges.filter(([challengeID, challengedUserID]) => {
      // Filter out any challenges that aren't for this user
      return challengedUserID.toString('hex') === selectedUserID.toString('hex')
    }).map(async ([challengeID]) => {
      // then get a challenge based on challenge ID
      const parsedChallengeID = getHexToBn(challengeID)
      const challenge = await API.query.datVerify.selectedChallenges(parsedChallengeID)

      // prepare response object
      const [pubkey, index, deadline] = challenge.toJSON().flat()
      const response = {
        user,
        pubkey,
        index,
        deadline,
        parsedChallengeID
      }
      LOG('Response:', JSON.stringify(response))
      return response
    }))
  }

  // RESPOND TO CHALLENGE
  async function sendProof ({ responses, feeds, keyring }) {
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
          const nonce = await getNonce(account)
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
    return API.query.system.events((events) => {
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

  function rerun (promiseFn, maxTries = 20, delay = 100) {
    let counter = 0
    while (true) {
      try {
        // Try to execute the promise function and return the result
        return promiseFn()
      } catch (error) {
        // If we get an error maxTries time, we finally error
        if (counter >= maxTries) throw error
      }
      // Otherwise we increase the counter and keep looping
      counter++
    }
  }
}
