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
    newUser,
    registerHoster,
    registerEncoder,
    registerAttestor,
    publishFeedAndPlan,
    encodingDone,
    hostingStarts,
    requestProofOfStorageChallenge,
    submitProofOfStorage,
    requestAttestation,
    submitAttestationReport,
    listenToEvents,
    getFeedByID,
    getPlanByID,
    getContractByID,
    getChallengeByID,
    getAttestationByID,
    getFeedKey,
    getUserAddress,
    getHosterKey,
    getEncoderKey,
    getEncodedIndex,
  }

  return chainAPI

  async function status ({ events = [], status }) {
    if (status.isInBlock) {
      events.forEach(({ phase, event: { data, method, section } }) => {
        LOG('\t', phase.toString(), `: ${section}.${method}`, data.toString())
      })
    }
  }
  async function newUser ({ signer, nonce }) {
    const register = await API.tx.datVerify.newUser()
    LOG(`Registering user: ${signer}`)
    await register.signAndSend(signer, { nonce }, status)
  }
  async function registerHoster ({ hosterKey, signer, nonce }) {
    const register = await API.tx.datVerify.registerHoster(hosterKey)
    LOG(`Registering hoster: ${signer}`)
    await register.signAndSend(signer, { nonce }, status)
  }
  async function registerEncoder ({ encoderKey, signer, nonce }) {
    const register = await API.tx.datVerify.registerEncoder(encoderKey)
    LOG(`Registering encoder: ${signer}`)
    await register.signAndSend(signer, { nonce }, status)
  }
  async function registerAttestor ({ signer, nonce }) {
    const register = await API.tx.datVerify.registerAttestor()
    LOG(`Registering attestor: ${signer}`)
    await register.signAndSend(signer, { nonce }, status)
  }
  async function publishFeedAndPlan (opts) {
    const { merkleRoot, plan, signer, nonce } = opts
    const publishFeedAndPlan = await API.tx.datVerify.publishFeedAndPlan(merkleRoot, plan)
    LOG(`Publishing data by user: ${signer}`)
    await publishFeedAndPlan.signAndSend(signer, { nonce }, status)
  }
  async function getFeedKey (feedID) {
    const feed = await API.query.datVerify.getFeedByID(feedID)
    return feed.publickey
  }
  async function getUserAddress (id) {
    const user = await API.query.datVerify.getUserByID(id)
    return user.address
  }
  async function getHosterKey (id) {
    const user = await API.query.datVerify.getUserByID(id)
    return user.hosterKey
  }
  async function getEncoderKey (id) {
    const user = await API.query.datVerify.getUserByID(id)
    return user.encoderKey
  }
  async function getContractByID (id) {
    return await API.query.datVerify.getContractByID(id)
  }
  async function getPlanByID (id) {
    return await API.query.datVerify.getPlanByID(id)
  }
  async function getFeedByID (id) {
    return await API.query.datVerify.getFeedByID(id)
  }
  async function getChallengeByID (id) {
    return await API.query.datVerify.getChallengeByID(id)
  }
  async function getAttestationByID (id) {
    return await API.query.datVerify.getAttestationByID(id)
  }

  async function getEncodedIndex (encoderAddress) {
    const encoded = await HostedMap.encoded
    encoded.forEach((item, i) => { if (item[0] === encoderAddress) return i })
  }

  async function encodingDone (opts) {
    const {contractID, signer, nonce} = opts
    const register = await API.tx.datVerify.encodingDone(contractID)
    LOG(`Encoding for contractID: ${contractID} is done`)
    await register.signAndSend(signer, { nonce }, status)
  }
  async function hostingStarts (opts) {
    const {contractID, signer, nonce} = opts
    const register = await API.tx.datVerify.hostingStarts(contractID)
    LOG(`Hosting for contractID: ${contractID} started`)
    await register.signAndSend(signer, { nonce }, status)
  }
  async function requestProofOfStorageChallenge (opts) {
    const {contractID, signer, nonce} = opts
    const request = await API.tx.datVerify.requestProofOfStorageChallenge(contractID)
    await request.signAndSend(signer, { nonce }, status)
  }
  async function submitProofOfStorage (opts) {
    const {challengeID, proof, signer, nonce} = opts
    LOG('Sending proof of storage to the chain', proof)
    const submit = await API.tx.datVerify.submitProofOfStorage(challengeID, proof)
    submit.signAndSend(signer, { nonce }, status)
  }
  async function requestAttestation (opts) {
    const {contractID, signer, nonce} = opts
    const request = await API.tx.datVerify.requestAttestation(contractID)
    await request.signAndSend(signer, { nonce }, status)
  }
  async function submitAttestationReport (opts) {
    const {attestationID, report, signer, nonce} =  opts
    LOG('Sending attestation to the chain', report)
    const submit = await API.tx.datVerify.submitAttestationReport(attestationID, report)
    submit.signAndSend(signer, { nonce }, status)
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
