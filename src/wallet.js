const Account = require('./account')
const { cryptoWaitReady } = require('@polkadot/util-crypto')
const ready = cryptoWaitReady();

module.exports = account

async function account (name) {
  await ready
  return await Account.load({
    persist: false,
    valueEncoding: 'binary',
    application: `datdot-account-${name}`
  })
}
