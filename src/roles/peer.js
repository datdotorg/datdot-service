// const chainAPI = require('datdot-chain')
// const serviceAPI = require('../..')
// const vaultAPI = require('datdot-account')
// const vaultAPI = require('datdot-vault')
const registrationForm = require('registrationForm')
const dateToBlockNumber = require('dateToBlockNumber')
/******************************************************************************
  ROLE: User

    1. create account

******************************************************************************/

module.exports = role

async function role (profile, APIS) {
  const { name, log } = profile
  const { chainAPI, vaultAPI } = APIS
  
  const nonce = await vaultAPI.getNonce()
  const myAddress = await vaultAPI.chainKeypair.address
  log({ type: 'peer', data: [`My address ${myAddress}`] })
  const signer = await vaultAPI.chainKeypair
  const noiseKey = await vaultAPI.publicKey
  const signingPublicKey = await vaultAPI.signingPublicKey
  const data = { signingPublicKey, noiseKey }
  log({ type: 'peer', data: [`New account created => ${myAddress}`] })
  await chainAPI.newUser({ signer, nonce, data })
}
