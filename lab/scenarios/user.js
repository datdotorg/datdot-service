const debug = require('debug')
const getChainAPI = require('../../src/chainAPI')
const logkeeper = require('./logkeeper')
const getServiceAPI = require('../../src/serviceAPI')
const getVaultAPI = require('../../src/vault.js')
// const getChatAPI = require('./chatAPI')

/******************************************************************************
  ACTIONS
******************************************************************************/
const ACTIONS = {
  account: require('../../src/account.js'),
  author_hypercore: require('../../src/author-hypercore.js'),
  request_service: require('../../src/roles/request-service.js'),
  provide_service: require('../../src/roles/provide-service.js'),
}
/******************************************************************************
  USER
******************************************************************************/
async function user ({name, actions}, config, logport) {
  const log = await logkeeper(name, logport)
  const profile = { name, log }
  const serviceAPI = getServiceAPI(profile)
  const chainAPI = await getChainAPI(profile, config.chain.join(':'))
  const vaultAPI = await getVaultAPI(profile)
  log({ type: 'user', data: [`start ${scenario}`] })
  const APIS = { serviceAPI, chainAPI, vaultAPI }
  actions = [...new Set(actions)]
  for (var i = 0, len = actions.length; i < len; i++) {
    const action_name = actions[i]
    const profile = { name, log: log.sub(action_name) }
    const action = ACTIONS[action_name]
    await action(profile, APIS)
  }
  captureErrors(log)
}
/******************************************************************************
  SCENARIO
******************************************************************************/
const [scenario, config, logport] = process.argv.slice(2)
user(JSON.parse(scenario), JSON.parse(config), logport)


function captureErrors (log) {
  process.on('unhandledRejection', error => {
    const stack = error.stack
    log({ type: 'user', data: [`unhandledRejection ${stack} ${error}`] })
  })
  process.on('uncaughtException', (error, origin) => {
    const stack = error.stack
    log({ type: 'user', data: [`uncaughtException ${stack} ${error} ${origin}`] })
  })
  process.on('warning', error => {
    const stack = error.stack
    log({ type: 'user', data: [`warning ${stack} ${error}`] })
  })
  process.setMaxListeners(0)
}
