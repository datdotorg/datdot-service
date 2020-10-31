const getData = require('../getFeed')
/******************************************************************************
  ROLE: Publisher
******************************************************************************/

module.exports = role

async function role (profile, APIS) {
  const { name, log } = profile
  const { serviceAPI, chainAPI, vaultAPI } = APIS
  const getChatAPI = require('../../lab/scenarios/chatAPI')
  const chatAPI = await getChatAPI(profile, ['ws://localhost', '8000'].join(':'))


  chatAPI.on(keys => {
    log({ type: 'publisher', body: [`Got the keys, publishing data now => ${keys}`] })
    publishFeed(JSON.parse(keys))
  })

  async function publishFeed (keys) {
    const feedkey = keys.feedkey
    const topic = keys.topic
    const data = await getData(log, feedkey, topic)
    log({ type: 'publisher', body: [`Got the data => ${data}`] })
    const myAddress = vaultAPI.chainKeypair.address
    log({ type: 'publisher', body: [`My address ${myAddress}`] })
    const signer = vaultAPI.chainKeypair
    const nonce = await vaultAPI.getNonce()
    await chainAPI.publishFeed({ merkleRoot: data, signer, nonce })
    await chainAPI.listenToEvents(handleEvent)
  }

  // EVENTS
  async function handleEvent (event) {}

}
