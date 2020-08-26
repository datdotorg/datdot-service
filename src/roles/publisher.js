const debug = require('debug')
const getData = require('../getFeed')
const getChainAPI = require('../chainAPI')
const getChatAPI = require('../../lab/scenarios/chatAPI')

/******************************************************************************
  ROLE: Publisher
******************************************************************************/
const ROLE = __filename.split('/').pop().split('.')[0].toLowerCase()

module.exports = role

async function role (profile, config) {
  const { name, account } = profile
  const log = debug(`[${name.toLowerCase()}:${ROLE}]`)
  profile.log = log
  const chainAPI = await getChainAPI(profile, config.chain.join(':'))
  const chatAPI = await getChatAPI(profile, config.chat.join(':'))
  chainAPI.listenToEvents(handleEvent)

  chatAPI.on(keys => {
    log('Got the keys, publishing data now', keys)
    publishFeed(JSON.parse(keys))
  })

  async function publishFeed (keys) {
    const feedkey = keys.feedkey
    const topic = keys.topic
    const data = await getData(feedkey, topic)
    log('Got the data', data)
    const myAddress = account.chainKeypair.address
    const signer = account.chainKeypair
    const nonce = await account.getNonce()
    await chainAPI.publishFeed({ merkleRoot: data, signer, nonce })
  }

  // EVENTS
  async function handleEvent (event) {}

}
