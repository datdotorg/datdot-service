const host = require('./roles/hoster')
const encode = require('./roles/encoder.js')
const attest = require('./roles/attester.js')

module.exports = datdot_service

async function datdot_service (profile, APIS) {
  const account = profile
  const { log } = account
  // TODO: given e.g. a feed address, offer helper features
  // => serviceAPI should offer feature to retrieve
  // => data required to submit to the chain to start a plan subscription
  return { host: host(APIS), encode: encode(APIS), attest: attest(APIS) }
}

