// const { /*ApiPromise,*/ WsProvider, Keyring } = require('@polkadot/api')
// const ApiPromise = require('./simulate-substrate')
// const provider = {}
const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api')
const provider = new WsProvider('ws://127.0.0.1:9944')
const { randomAsU8a } = require('@polkadot/util-crypto') // make sure version matches api version
const { hexToBn, u8aToBuffer, bufferToU8a } = require('@polkadot/util')
const fs = require('fs')
const path = require('path')
const filename = path.join(__dirname, './types.json')
const types = JSON.parse(fs.readFileSync(filename).toString())
// const types = require('datdot-substrate/types.json')

module.exports = datdotChain

async function datdotChain () {
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

  async function newUser ({ signer, nonce }) {
    // @TODO try to send nonce as a hex https://www.npmjs.com/package/bn.js
    const txHash = await API.tx.datVerify
      .newUser()
      .signAndSend(signer)
  }
  async function registerHoster ({ hosterKey, signer, nonce }) {
    hosterKey = bufferToU8a(hosterKey)
    const txHash = await API.tx.datVerify
      .registerHoster(hosterKey)
      .signAndSend(signer)
  }
  async function registerEncoder ({ encoderKey, signer, nonce }) {
    encoderKey = bufferToU8a(encoderKey)
    const txHash = await API.tx.datVerify
      .registerEncoder(encoderKey)
      .signAndSend(signer)
  }
  async function registerAttestor ({ signer, nonce }) {
    const txHash = await API.tx.datVerify
      .registerAttestor()
      .signAndSend(signer)
  }
  async function publishFeedAndPlan (opts) {
    const { merkleRoot, ranges, signer, nonce } = opts
    merkleRoot[0] = bufferToU8a(merkleRoot[0])
    const txHash = await API.tx.datVerify
      .publishFeedAndPlan(merkleRoot, ranges)
      .signAndSend(signer)
  }
  async function getFeedKey (feedID) {
    const feed = (await API.query.datVerify.getFeedByID(feedID)).unwrap()
    // console.log('feed', feed)
    return u8aToBuffer(feed.publickey.toU8a())
  }
  async function getUserAddress (id) {
    const user = (await API.query.datVerify.getUserByID(id)).unwrap()
    return user.address.toString()
  }
  async function getHosterKey (id) {
    const user = (await API.query.datVerify.getUserByID(id)).unwrap()
    // @TODO check if this makes sense
    // returned buffer has additional byte 01 at the beginning, use slice to make it match the original
    return u8aToBuffer(user.noise_key.toU8a().slice(1))
  }
  async function getEncoderKey (id) {
    const user = (await API.query.datVerify.getUserByID(id)).unwrap()
    // @TODO check if this makes sense
    // returned buffer has additional byte 01 at the beginning, use slice to make it match the original
    return u8aToBuffer(user.noise_key.toU8a().slice(1))
  }
  async function getContractByID (id) {
    return (await API.query.datVerify.getContractByID(id)).toJSON()
  }
  async function getPlanByID (id) {
    return (await API.query.datVerify.getPlanByID(id)).toJSON()
  }
  async function getFeedByID (id) {
    const feedID = (await API.query.datVerify.getFeedByID(id)).toJSON()
    return feedID
  }
  async function getChallengeByID (id) {
    return (await API.query.datVerify.getChallengeByID(id)).toJSON()
  }
  async function getAttestationByID (id) {
    return (await API.query.datVerify.getAttestationByID(id)).toJSON()
  }

  async function getEncodedIndex (encoderAddress) {
    const encoded = await HostedMap.encoded
    encoded.forEach((item, i) => { if (item[0] === encoderAddress) return i })
  }

  async function encodingDone (opts) {
    const {contractID, signer, nonce} = opts
    const txHash = await API.tx.datVerify
      .encodingDone(contractID)
      .signAndSend(signer)
  }
  async function hostingStarts (opts) {
    const {contractID, signer, nonce} = opts
    const txHash = await API.tx.datVerify
      .hostingStarts(contractID)
      .signAndSend(signer)
  }
  async function requestProofOfStorageChallenge (opts) {
    const {contractID, signer, nonce} = opts
    const txHash = await API.tx.datVerify
      .requestProofOfStorageChallenge(contractID)
      .signAndSend(signer)
  }
  async function submitProofOfStorage (opts) {
    const {challengeID, proofs, signer, nonce} = opts
    const txHash = await API.tx.datVerify
      .submitProofOfStorage(challengeID, proofs)
      .signAndSend(signer)
  }
  async function requestAttestation (opts) {
    const {contractID, signer, nonce} = opts
    const txHash = await API.tx.datVerify
      .requestAttestation(contractID)
      .signAndSend(signer)
  }
  async function submitAttestationReport (opts) {
    const {attestationID, report, signer, nonce} =  opts
    const txHash = await API.tx.datVerify
      .submitAttestationReport(attestationID, report)
      .signAndSend(signer)
  }
  // LISTEN TO EVENTS
  async function listenToEvents (handleEvent) {
    return API.query.system.events((events) => {
      events.forEach(async (record) => {
        // console.log(record.event.method, record.event.data.toString())
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
