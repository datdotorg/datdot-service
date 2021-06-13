const getChainAPI = require('../../src/chainAPI')
const logkeeper = require('./logkeeper')
const getVaultAPI = require('../../src/vault.js')
// const getChatAPI = require('./chatAPI')

/******************************************************************************
  ACTIONS
******************************************************************************/
const ACTIONS = {
  register: require('../../src/register.js'),
  author_hypercore: require('../../src/author-hypercore.js'),
  request_hosting: require('../../src/REQUEST-HOSTING.js'),
  offer_hosting: require('../../src/OFFER-HOSTING.js'),
}
/******************************************************************************
  USER
******************************************************************************/
async function user ({name, actions}, config, logport) {
  const [log] = await logkeeper(name, logport)
  const profile = { name, log }
  const chainAPI = await getChainAPI(profile, config.chain.join(':'))
  const vaultAPI = await getVaultAPI(profile)
  log({ type: 'user', data: [`start ${scenario}`] })
  const APIS = { chainAPI, vaultAPI }
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
    const stack = (error||{}).stack
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
