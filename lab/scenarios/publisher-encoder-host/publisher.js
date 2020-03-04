const datdotchain = require('datdot-chain')
const colors = require('colors/safe')
const NAME = __filename.split('/').pop().split('.')[0].toUpperCase()
function LOG (...msgs) {
  msgs = [`[${NAME}] `, ...msgs].map(msg => colors.red(msg))
  console.log(...msgs)
}
// ----------------------------------------------------------------------------
const pkey = 'keypair.pkey.publisher' // unique for each role/account (for scenario)

const opts = { }
datdotchain(opts, (err, send) => {
  if (err) return LOG(err)

  var counter = 0
  var ID

  const nonce = counter++
  const proof = '19ur183f' // generate proof
  const data = { nonce, pkey, proof }
  const signature = '...' // sign(data)

  // API.makeAccount({ signature, ID: null, data }, onAccount)
  const message = { type: 'make_account', ID: null, signature, data }
  send(message, onAccount)

  function onAccount (err, data) {
    if (err) return LOG(err)
    ID = data.ID // new account ID


    const nonce = counter++
    const feedkey = '<from hypercore>'
    const data = { nonce, feedkey }
    const signature = '...' // sign(data)

    // API.publishData({ signature, ID, data }, onPublish)
    const message = { type: 'publishData', ID, signature, data }
    send(message, onPublish)

  }
  function onPublish (err) {
    if (err) return LOG(err)
    LOG('success! :-)')
  }
})
