const debug = require('debug')
const getData = require('../getFeed')
const getChainAPI = require('../chainAPI')
// const serviceAPI = require('../..')


/******************************************************************************
  ROLE: Publisher
******************************************************************************/
const ROLE = __filename.split('/').pop().split('.')[0].toLowerCase()

module.exports = role

async function role ({ name, account }) {
  const log = debug(`[${name.toLowerCase()}:${ROLE}]`)
  const chainAPI = await getChainAPI()
  chainAPI.listenToEvents(handleEvent)

  //create or use existing data
  // @TODO: seed hypercore in a separate process and just pass in the feed key and swarm key
  const data = await getData(account)
  log('Publishing data', data[0].toString('hex'))
  const myAddress = account.chainKeypair.address
  const signer = account.chainKeypair
  const nonce = await account.getNonce()
  // @TODO later pass a more sofisticated plan which will include ranges
  // publish data and plan to chain (= request hosting)
  await chainAPI.publishFeed({merkleRoot: data, signer, nonce})

  // EVENTS
  async function handleEvent (event) {
  }
}
