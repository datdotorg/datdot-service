const debug = require('debug')
const getChainAPI = require('../../src/chainAPI')
const getServiceAPI = require('../../src/serviceAPI')
const getVaultAPI = require('../../src/wallet.js')
const getChatAPI = require('./chatAPI')
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
async function user ({name, roles}, config, log) {
  const profile = { name, log }
  const APIS = {
    serviceAPI: getServiceAPI(profile),
    chainAPI: await getChainAPI(profile, config.chain.join(':')),
    chatAPI: await getChatAPI(profile, config.chat.join(':')),
    vaultAPI: await getVaultAPI(profile),
  }
  roles = [...new Set(roles)]
  for (var i = 0, len = roles.length; i < len; i++) {
    const rolename = roles[i]
    const profile = { name, log: log.extend(rolename) }
    const role = ROLES[rolename]
    await role(profile, APIS)
  }
}
/******************************************************************************
  SCENARIO
******************************************************************************/
const [scenarioJSON, configJSON] = process.argv.slice(2)
const [scenario, config] = [JSON.parse(scenarioJSON), JSON.parse(configJSON)]
const log = debug(`[${scenario.name}]`)
log(`start:`, scenario, config)
user(scenario, config, log)
