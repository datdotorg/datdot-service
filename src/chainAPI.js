const { /*ApiPromise,*/ WsProvider, Keyring } = require('@polkadot/api')
// const provider = new WsProvider('ws://127.0.0.1:9944')
const { randomAsU8a } = require('@polkadot/util-crypto') // make sure version matches api version
const { hexToBn } = require('@polkadot/util')

const provider = {}
const ApiPromise = require('./simulate-substrate')

const fs = require('fs')
const path = require('path')
const filename = path.join(__dirname, './types.json')
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
    registerHoster,
    registerEncoder,
    registerAttestor,
    publishData,
    registerEncoding,
    confirmHosting,
    submitChallenge,
    submitProof,
    submitAttestation,
    listenToEvents,
    getArchive,
    getUser,
  }

  return chainAPI

  function getNonce(account) {
		const {name} = account
		let nonce = (nonces[name] || 0)
		nonce++
		nonces[name] = nonce
		return nonce - 1
  }

  async function status ({ events = [], status }) {
    LOG('Calling the chain')
    if (status.isInBlock) {
      events.forEach(({ phase, event: { data, method, section } }) => {
        LOG('\t', phase.toString(), `: ${section}.${method}`, data.toString())
      })
    }
  }

  async function registerHoster ({ account }) {
    const register = await API.tx.datVerify.registerSeeder()
    const nonce = await getNonce(account)
    LOG(`Registering hoster: ${account.name} ${nonce}`)
    console.log('account', account.address)
    await register.signAndSend(account, { nonce }, status)
  }

  async function registerEncoder ({ account }) {
    const register = await API.tx.datVerify.registerEncoder()
    const nonce = await getNonce(account)
    LOG(`Registering encoder: ${account.name} ${nonce}`)
    await register.signAndSend(account, { nonce }, status)
  }

  async function registerAttestor ({ account }) {
    const register = await API.tx.datVerify.registerAttestor()
    const nonce = await getNonce(account)
    LOG(`Registering encoder: ${account.name} ${nonce}`)
    await register.signAndSend(account, { nonce }, status)
  }

  async function publishData (opts) {
    const { merkleRoot, account } = opts
    const registerData = await API.tx.datVerify.registerData(merkleRoot)
    const nonce = await getNonce(account)
    LOG(`Publishing data: ${account.name} ${nonce}`)
    await registerData.signAndSend(account, { nonce }, status)
  }

  async function getArchive (archive_index) {
    return await API.query.datVerify.dat(archive_index)
  }

  async function getUser (id) { return API.query.datVerify.users(id) }

  async function registerEncoding (opts) {
    const {account, hosterID, datID, start, range} = opts
    const args = [hosterID, datID, start, range]
    const register = await API.tx.datVerify.registerEncoding(args)
    const nonce = await getNonce(account)
    LOG(`Register encoding: ${account.name} ${nonce}`)
    await register.signAndSend(account, { nonce }, status)
  }

  async function confirmHosting (opts) {
    const {account, archive} = opts
    const confirm = await API.tx.datVerify.confirmHosting(archive)
    const nonce = await getNonce(account)
    LOG(`Confriming hosting: ${account.name} ${nonce}`)
    await register.signAndSend(account, { nonce }, status)
  }

  async function submitChallenge ({ account, userID, feedID }) {
    const challenge = await API.tx.datVerify.submitChallenge(userID, feedID)
    const nonce = await getNonce(account)
    LOG(`Requesting a new challenge: ${userID.toString('hex')}, ${feedID.toString('hex')}`)
    await challenge.signAndSend(account, { nonce }, status)
  }

  async function submitProof ({ data, accounts }) {
    LOG('Getting the challenge and submitting the proof)')
    const {hosterID, datID} = data
    const hostedArchive = api.query.dat_verify.hostedMap(hosterID, datID)

    const challengeMap = hostedArchive.state

    for (const challenge_index in challengeMap) {
      challenge = challengeMap.get(challenge_index)
      const proof = await API.tx.datVerify.submitProof(challenge_index, [])
      const account = keyring.getPair(user.toString('hex'))
      const nonce = await getNonce(account)
      proof.signAndSend(account, { nonce }, status)
    }
  }

  async function submitAttestation () {
    
  }
  // submit_attestation(origin, hoster_index: u64, dat_index: u64,chunk_index: u64, attestation: Attestation)

  // LISTEN TO EVENTS
  async function listenToEvents (handleEvent) {
    return API.query.system.events((events) => {
      events.forEach(async (record) => {
        const event = record.event
        handleEvent(event)
      })
    })
  }

  function rerun (promiseFn, maxTries = 20, delay = 100) {
    let counter = 0
    while (true) {
      // Try to execute the promise function and return the result
      try { return promiseFn() }
      // If we get an error maxTries time, we finally error
      catch (error) { if (counter >= maxTries) throw error }
      // Otherwise we increase the counter and keep looping
      counter++
    }
  }
}
