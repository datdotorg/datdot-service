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
    requestProofOfStorage,
    submitProofOfStorage,
    attestDataServing,
    listenToEvents,
    getFeedKeyByID,
    getRandomChunksForFeed,
    getUserByID,
    getEncodedIndex,
    getContractByID,
    getPublisherByPlanID,
    getChalengeByID

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
  async function registerHoster ({ signer, nonce }) {
    const register = await API.tx.datVerify.registerHoster()
    LOG(`Registering hoster: ${signer}`)
    await register.signAndSend(signer, { nonce }, status)
  }
  async function registerEncoder ({ signer, nonce }) {
    const register = await API.tx.datVerify.registerEncoder()
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
  async function getFeedKeyByID (feedID) {
    return await API.query.datVerify.getFeedKeyByID(feedID)
  }
  async function getRandomChunksForFeed (contractID) {
    return await API.query.datVerify.getRandomChunksForFeed(contractID)
  }
  async function getUserByID (id) { return await API.query.datVerify.getUserByID(id) }
  async function getContractByID (contractID) {
    return await API.query.datVerify.getContractByID(contractID)
  }
  async function getChalengeByID (challengeID) {
    return await API.query.datVerify.getChalengeByID(challengeID)
  }
  async function getPublisherByPlanID (planID) {
    return await API.query.datVerify.getPublisherByPlanID(planID)
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
  async function requestProofOfStorage (opts) {
    const {contractID, signer, nonce} = opts
    const request = await API.tx.datVerify.requestProofOfStorage(contractID)
    LOG(`Requesting a Proof of storage for hosting from ContractID:${contractID}`)
    await request.signAndSend(signer, { nonce }, status)
  }
  async function submitProofOfStorage (opts) {
    const {challengeID, proof, signer, nonce} = opts
    const submit = await API.tx.datVerify.submitProofOfStorage(challengeID, proof)
    submit.signAndSend(signer, { nonce }, status)
  }
  async function attestDataServing (opts) {
    const {challengeID, attestation, signer, nonce} =  opts
    LOG('Sending attestation to the chain', attestation)
    const submit = await API.tx.datVerify.attestDataServing(challengeID, attestation)
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
