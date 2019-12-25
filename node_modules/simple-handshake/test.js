var hs = require('.')

var serverKeys = hs.keygen()
var clientKeys = hs.keygen()

var server = hs(false, {
  pattern: 'NN',
  // staticKeyPair: serverKeys,
  onstatickey: function (key, cb) {
    console.log('client key', key.equals(clientKeys.publicKey))

    setTimeout(cb, 1000)
  },
  onephemeralkey: function (key, cb) {
    console.log('server recv ekey', key.toString('hex'))

    setTimeout(cb, 1000)
  },
  onhandshake: function (state, cb) {
    console.log('server state')

    setTimeout(cb, 1000)
  }
})

var client = hs(true, {
  pattern: 'NN',
  // staticKeyPair: clientKeys,
  onstatickey: function (key, cb) {
    console.log('client recv key', key.equals(serverKeys.publicKey))

    setTimeout(cb, 1000)
  },
  onephemeralkey: function (key, cb) {
    console.log('server ekey', key.toString('hex'))

    setTimeout(cb, 1000)
  },
  onhandshake: function (state, cb) {
    console.log('client state')

    setTimeout(cb, 1000)
  }
})

client.send(Buffer.from('Hello world'), function (err, buf1) {
  if (err) throw err
  server.recv(buf1, function (err, msg1) {
    if (err) throw err

    server.send(null, function (err, buf2) {
      if (err) throw err

      client.recv(buf2, function (err, msg2) {
        if (err) throw err

        return console.log(client, server)

        client.send(null, function (err, buf3) {
          if (err) throw err

          server.recv(buf3, function (err, msg3) {
            if (err) throw err

            console.log(client, server)
          })
        })
      })
    })
  })
})
