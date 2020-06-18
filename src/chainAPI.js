const { /*ApiPromise,*/ WsProvider, Keyring } = require('@polkadot/api')
// const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api')
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
  const chainAPI = {
    registerHoster,
    registerEncoder,
    registerAttestor,
    registerData,
    registerEncoding,
    confirmHosting,
    submitChallenge,
    submitProof,
    attest,
    listenToEvents,
    getArchive,
    getUser,
  }

  return chainAPI

  async function status ({ events = [], status }) {
    if (status.isInBlock) {
      events.forEach(({ phase, event: { data, method, section } }) => {
        LOG('\t', phase.toString(), `: ${section}.${method}`, data.toString())
      })
    }
  }

  async function registerHoster ({ account, nonce }) {
    const register = await API.tx.datVerify.registerHoster()
    LOG(`Registering hoster: ${account.address}`)
    await register.signAndSend(account, { nonce: nonce }, status)
  }

  async function registerEncoder ({ account, nonce }) {
    const register = await API.tx.datVerify.registerEncoder()
    LOG(`Registering encoder: ${account.address}`)
    await register.signAndSend(account, { nonce: nonce }, status)
  }

  async function registerAttestor ({ account, nonce }) {
    const register = await API.tx.datVerify.registerAttestor()
    LOG(`Registering attestor: ${account.address}`)
    await register.signAndSend(account, { nonce: nonce }, status)
  }

  async function registerData (opts) {
    const { merkleRoot, account, nonce } = opts
    const registerData = await API.tx.datVerify.registerData(merkleRoot)
    LOG(`Publishing data: ${account.address} ${nonce}`)
    await registerData.signAndSend(account, { nonce }, status)
  }

  async function getArchive (archive_index) {
    return await API.query.datVerify.dat(archive_index)
  }

  async function getUser (id) { return API.query.datVerify.users(id) }

  async function registerEncoding (opts) {
    const {account, nonce, hosterID, datID, start, range} = opts
    const args = [hosterID, datID, start, range]
    const register = await API.tx.datVerify.registerEncoding(args)
    LOG(`Register encoding: ${account.address}`)
    await register.signAndSend(account, { nonce: nonce }, status)
  }

  async function confirmHosting (opts) {
    const {account, nonce, archive, index} = opts
    const confirm = await API.tx.datVerify.confirmHosting(archive, index)
    LOG(`Confriming hosting: ${account.address}`)
    await register.signAndSend(account, { nonce: nonce }, status)
  }

  async function submitChallenge ({ account, userID, feedID, nonce }) {
    const challenge = await API.tx.datVerify.submitChallenge(userID, feedID)
    LOG(`Requesting a new challenge: ${userID.toString('hex')}, ${feedID.toString('hex')}`)
    await challenge.signAndSend(account, { nonce: nonce }, status)
  }

  async function submitProof ({ data, accounts, account, nonce }) {
    LOG('Getting the challenge and submitting the proof)')
    const {hosterKey, datKey} = data

    const hosterID = await API.query.dat_verify.userIndices(hosterKey)
    const datID = api.query.dat_verify.datIndex(datKey)

    const hostedArchive = api.query.dat_verify.hostedMap(hosterID, datID)

    const challengeMap = hostedArchive.state

    for (const challenge_index in challengeMap) {
      challenge = challengeMap.get(challenge_index)
      const proof = await API.tx.datVerify.submitProof(challenge_index, [])
      // array of bytes (proof format) => fetch from Mauve's proof folder
      const account = keyring.getPair(user.toString('hex')) // @TODO pass account from service-mvp
      proof.signAndSend(account, { nonce: nonce }, status)
    }
  }

  async function attest (opts) {
    const {challengeID, attestorIDs, keyring, nonce} =  opts
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
