const debug = require('debug')
const getChainAPI = require('../chainAPI')
// const chainAPI = require('datdot-chain')
// const serviceAPI = require('../..')
// const vaultAPI = require('datdot-account')
// const vaultAPI = require('datdot-vault')
/******************************************************************************
  ROLE: User

    1. create account

******************************************************************************/
const ROLE = __filename.split('/').pop().split('.')[0].toLowerCase()

module.exports = role

async function role ({ name, account }) {
  const log = debug(`[${name.toLowerCase()}:${ROLE}]`)
  const chainAPI = await getChainAPI()
  const nonce = await account.getNonce()
  const myAddress = account.chainKeypair.address
  const signer = account.chainKeypair
  log(`New account created => ${myAddress}`)
  await chainAPI.newUser({signer, nonce})
}
