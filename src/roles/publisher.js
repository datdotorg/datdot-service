const getData = require('../getFeed')
/******************************************************************************
  ROLE: Publisher
******************************************************************************/

module.exports = role

async function role (profile, APIS) {
  const { name, log } = profile
  const { serviceAPI, chainAPI, chatAPI, vaultAPI } = APIS

  await chainAPI.listenToEvents(handleEvent)

  chatAPI.on(keys => {
    log('Got the keys, publishing data now', keys)
    publishFeed(JSON.parse(keys))
  })

  async function publishFeed (keys) {
    const feedkey = keys.feedkey
    const topic = keys.topic
    const data = await getData(log, feedkey, topic)
    log('Got the data', data)
    const myAddress = vaultAPI.chainKeypair.address
    const signer = vaultAPI.chainKeypair
    const nonce = await vaultAPI.getNonce()
    await chainAPI.publishFeed({ merkleRoot: data, signer, nonce })
  }

  // EVENTS
  async function handleEvent (event) {}

}
