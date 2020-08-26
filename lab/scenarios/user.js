const debug = require('debug')
const makeAccount = require('../../src/wallet.js')
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
  const account = await makeAccount(name)
  for (var i = 0, len = roles.length; i < len; i++) {
    const role = ROLES[roles[i]]
    await role({ name, account }, config)
  }
}
/******************************************************************************
  SCENARIO
******************************************************************************/
const [scenarioJSON, configJSON] = process.argv.slice(2)
const [scenario, config] = [JSON.parse(scenarioJSON), JSON.parse(configJSON)]
const log = debug(`[${scenario.name}]`)
log(`start:`, scenario, config)
user(scenario, config)
