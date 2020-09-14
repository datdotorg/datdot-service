const debug = require('debug')
const getChainAPI = require('../../src/chainAPI')
const getLogAPI = require('./logAPI')
const getServiceAPI = require('../../src/serviceAPI')
const getVaultAPI = require('../../src/wallet.js')
// const getChatAPI = require('./chatAPI')

/******************************************************************************
  ROLES
******************************************************************************/
const ROLES = {
  peer: require('../../src/roles/peer.js'),
  publisher: require('../../src/roles/publisher.js'),
  sponsor: require('../../src/roles/sponsor.js'),
  hoster: require('../../src/roles/hoster.js'),
  encoder: require('../../src/roles/encoder.js'),
  attestor: require('../../src/roles/attestor.js'),
  author: require('../../src/roles/author.js'),
}
/******************************************************************************
  USER
******************************************************************************/
async function user ({name, roles}, config) {
  const log = await getLogAPI(name, config.log.join(':'))
  const profile = { name, log }
  const serviceAPI = getServiceAPI(profile)
  const chainAPI = await getChainAPI(profile, config.chain.join(':'))
  const vaultAPI = await getVaultAPI(profile)
  log(`start:`, scenario, config)
  const APIS = { serviceAPI, chainAPI, vaultAPI }
  roles = [...new Set(roles)]
  for (var i = 0, len = roles.length; i < len; i++) {
    const rolename = roles[i]
    const profile = { name, log: log.sub(rolename) }
    const role = ROLES[rolename]
    await role(profile, APIS)
  }
}
/******************************************************************************
  SCENARIO
******************************************************************************/
const [scenario, config] = process.argv.slice(2)
user(JSON.parse(scenario), JSON.parse(config))
