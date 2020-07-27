const debug = require('debug')
const makeAccount = require('../../src/wallet.js')
/*****************************************************************************/
// const NAME = __filename.split('/').pop().split('.')[0].toUpperCase()
const NAME = __filename.split('/').slice(-2, -1)[0].split('.')[0].toUpperCase()
const log = debug(`SCENARIO-${NAME}`)
/******************************************************************************
  USERS
******************************************************************************/
const users = ['Alice', 'Bob', 'Charlie', 'Dave', 'Eve'].map(name => {
  return async function user (roles) {
    const account = await makeAccount(name)
    for (var i = 0, len = roles.length; i < len; i++) {
      const role = roles[i]
      await role({ name, account })
    }
  }
})
/******************************************************************************
  ROLES
******************************************************************************/
const user = require('../../src/roles/user.js')
const publisher = require('../../src/roles/publisher.js')
const hoster = require('../../src/roles/hoster.js')
const encoder = require('../../src/roles/encoder.js')
const attestor = require('../../src/roles/attestor.js')
/******************************************************************************
  SCENARIO
******************************************************************************/
const [ alice, bob, charlie, dave, eve ] = users

log('start scenario')

alice([user, publisher, encoder, hoster, attestor])
bob([user, hoster, encoder])
charlie([user, encoder, hoster, attestor])
dave([user, encoder, hoster, attestor])
eve([user, encoder, hoster, attestor])
