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
const NAME = __filename.split('/').pop().split('.')[0].toLowerCase()

module.exports = role

async function role ({ name, account }) {
  const log = debug(`[${name.toLowerCase()}:${NAME}]`)
  const chainAPI = await getChainAPI()
  const nonce = await account.getNonce()
  const signer = account.chainKeypair.address
  await chainAPI.newUser({signer, nonce})

  log('create account')
}
