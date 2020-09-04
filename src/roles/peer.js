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
  const { name, account, log } = profile
  const { chainAPI } = APIS

  const nonce = await account.getNonce()
  const myAddress = account.chainKeypair.address
  const signer = account.chainKeypair
  log(`New account created => ${myAddress}`)
  await chainAPI.newUser({ signer, nonce })
}
