const host = require('./roles/hoster')
const encode = require('./roles/encoder.js')
const attest = require('./roles/attester.js')
const feed_store = require('_datdot-service-helpers/feed-store')

// const keypair = {}
// const vault = {}
var counter = 0

module.exports = datdot_service

async function datdot_service (profile, APIS) {
  // vault.foobar()
  // keypair.sign()

  const instance_kp = keypair.sub(counter++)

  const account = await APIS.vaultAPI
  const { log } = profile
  log({ type: '@todo', data: 'given e.g. a feed address, offer helper features' })
  // TODO: given e.g. a feed address, offer helper features
  // => serviceAPI should offer feature to retrieve
  // => data required to submit to the chain to start a plan subscription
  return { host: host(APIS), encode: encode(APIS), attest: attest(APIS) }
}

// TODO
// go through hoster, attestor and encoder and see which logic repeats
// make these repeating logic into functions and move them to service API
// make hoster/encoder/attestor call servceAPI to execute this logic