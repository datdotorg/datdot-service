// const chainAPI = require('datdot-chain')
// const serviceAPI = require('../..')
// const vaultAPI = require('datdot-account')
// const vaultAPI = require('datdot-vault')
/******************************************************************************
  ROLE: User

    1. create account

******************************************************************************/

module.exports = role

async function role (profile, APIS) {
  const { name, log } = profile
  const { chainAPI, vaultAPI } = APIS

  const nonce = await vaultAPI.getNonce()
  const myAddress = vaultAPI.chainKeypair.address
  const signer = vaultAPI.chainKeypair
  log(`New account created => ${myAddress}`)
  await chainAPI.newUser({ signer, nonce })
}
