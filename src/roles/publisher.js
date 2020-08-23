const debug = require('debug')
const getData = require('../getFeed')
const getChainAPI = require('../chainAPI')

/******************************************************************************
  ROLE: Publisher
******************************************************************************/
const ROLE = __filename.split('/').pop().split('.')[0].toLowerCase()

module.exports = role

async function role ({ name, account }) {
  const log = debug(`[${name.toLowerCase()}:${ROLE}]`)
  const chainAPI = await getChainAPI()
  chainAPI.listenToEvents(handleEvent)

  const feedkey1 = '4a4f951ed9bd3a1893e5c6bc18becda04e9a31acbb079d0cac0f366ea4ee781b'
  const swarmkey1= 'ed69eb1cdb5e7ad8fcf0fcb3ff74c83b22592721db8e8ab43b3f2e0ed665bc04'
  const feed1 = await getData(feedkey1, swarmkey1)

  const feedkey2 = '93d02ccda89fe76c9bdc70b30f273dc101345d65256dc22bc47b52464d55472d'
  const swarmkey2 = 'febe6a9d42a6f46c9e13b47cd7a9db3502ebcf92156b6ff59efc6cf1f520eba0'
  const feed2 = await getData(feedkey2, swarmkey2)

  const feeds = [feed1, feed2]
  log('Publishing feeds', feeds)

  const myAddress = account.chainKeypair.address
  const signer = account.chainKeypair
  const nonce = await account.getNonce()
  // @TODO later pass a more sofisticated plan which will include ranges
  // publish data and plan to chain (= request hosting)
  await chainAPI.publishFeeds({ feeds, signer, nonce })

  // EVENTS
  async function handleEvent (event) {
  }
}
