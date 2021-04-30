const registrationForm = require('registrationForm')
const dateToBlockNumber = require('dateToBlockNumber')
const host = require('./tasks/host.js')
const encode = require('./tasks/encode.js')
const attest = require('./tasks/attest.js')
/******************************************************************************
  ROLE: hoster

    1. register for work

******************************************************************************/

module.exports = hoster

async function hoster (profile, APIS) {
  const { name, log } = profile
  const { chainAPI, vaultAPI } = APIS
  
  const myAddress = await vaultAPI.chainKeypair.address
  const nonce = await vaultAPI.getNonce()
  const signer = await vaultAPI.chainKeypair
  const noiseKey = await vaultAPI.noisePublicKey
  const identity = { myAddress, signer, noiseKey }
  
  const duration = await get_duration(chainAPI)
  const form = registrationForm(duration)
  await chainAPI.registerForWork({ signer, nonce, form })
  encode(identity, log, APIS)
  host(identity, log, APIS)
  attest(identity, log, APIS)
}

async function get_duration (chainAPI) {
  const blockNow = await chainAPI.getBlockNumber()
  const until = new Date('Dec 26, 2021 23:55:00')
  const untilBlock = dateToBlockNumber ({ dateNow: new Date(), blockNow, date: until })
  return { from: blockNow, until: untilBlock }
}