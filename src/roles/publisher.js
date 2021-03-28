const get_feed_metadata = require('../get_feed_metadata')
/******************************************************************************
  ROLE: Publisher
******************************************************************************/

module.exports = role

async function role (profile, APIS) {
  const { name, log } = profile
  const { serviceAPI, chainAPI, vaultAPI } = APIS
  const getChatAPI = require('../../lab/simulations/chatAPI')
  const chatAPI = await getChatAPI(profile, ['ws://localhost', '8000'].join(':'))


  // chatAPI.on(keys => {
  //   log({ type: 'publisher', data: [`Got the keys, publishing data now => ${keys}`] })
  //   publishFeed(JSON.parse(keys))
  // })

  async function publishFeed (keys) {
    const feedkey = keys.feedkey
    const topic = keys.topic
    const data = await get_feed_metadata(log, feedkey, topic)
    log({ type: 'publisher', data: [`Got the data => ${data}`] })
    const myAddress = await vaultAPI.chainKeypair.address
    log({ type: 'publisher', data: [`My address ${myAddress}`] })
    const signer = await vaultAPI.chainKeypair
    const nonce = await vaultAPI.getNonce()
    await chainAPI.publishFeed({ merkleRoot: data, signer, nonce })
    await chainAPI.listenToEvents(handleEvent)
  }

  // EVENTS
  async function handleEvent (event) {}

}
