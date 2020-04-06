const hyperswarm = require('@hyperswarm/network')
const Client = require('./client')
const Server = require('./server')

const test = require('tape')
const getPort = require('get-port')
const crypto = require('crypto')

test('discover and make connections', async (t) => {
  // Each test should use a different topic to avoid connecting to other machines running the test
  const TEST_TOPIC = makeTopic('HYPERSWARM-PROXY-TEST' + Math.random())
  const TEST_MESSAGE = 'Hello World'

  t.plan(4)

  try {
    const server = new Server()

    const network = hyperswarm({
      socket: handleSocket
    })

    const port = await getPort()

    const proxy = `ws://localhost:${port}`

    server.listen(port)

    const swarm = new Client({
      proxy
    })

    let connectionCount = 0

    process.once('SIGINT', cleanupAndExit)
    // process.once('uncaughtException', cleanupAndExit)

    swarm.on('connection', handleConnection)

    network.bind(() => {
      network.announce(TEST_TOPIC)
      swarm.join(TEST_TOPIC)
    })

    function cleanupAndExit (e) {
      if (e) {
        t.fail(e)
      }
      cleanup(() => {
        process.exit(0)
      })
    }

    function cleanup (cb) {
      swarm.destroy(() => {
        server.destroy(() => {
          network.close(() => {
            if (cb) cb()
          })
        })
      })
    }
    function handleConnection (connection, info) {
      connection.on('error', () => {
        // Whatever
      })

      if (connectionCount++) return connection.end()

      t.deepEqual(info.peer.topic, TEST_TOPIC, 'got connection in client')
      connection.on('data', () => {
        t.pass('got data from peer')
        connection.end()
      })

      connection.once('close', () => {
        cleanup(() => {
          t.end()
        })
      })
      connection.write(TEST_MESSAGE)
    }

    function handleSocket (socket) {
      t.pass('got connection to peer')
      socket.on('data', () => {
        t.pass('got data to peer')
        socket.end(TEST_MESSAGE)
      })
    }
  } catch (e) {
    t.fail(e)
  }
})

function makeTopic (text) {
  return crypto.createHash('sha256')
    .update(text)
    .digest()
}
