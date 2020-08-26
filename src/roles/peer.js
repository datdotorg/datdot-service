const debug = require('debug')
const getChainAPI = require('../chainAPI')
const getChatAPI = require('../../lab/scenarios/chatAPI')
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

async function role (profile, config) {
  const { name, account } = profile
  const log = debug(`[${name.toLowerCase()}:${ROLE}]`)
  profile.log = log
  const chainAPI = await getChainAPI(profile, config.chain.join(':'))
  const chatAPI = await getChatAPI(profile, config.chat.join(':'))
  const nonce = await account.getNonce()
  const myAddress = account.chainKeypair.address
  const signer = account.chainKeypair
  log(`New account created => ${myAddress}`)
  await chainAPI.newUser({ signer, nonce })
}
