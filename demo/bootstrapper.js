const DHT = require('@hyperswarm/dht')

module.exports = bootstrappers

async function bootstrappers ({ amount = 1, log = console.log.bind(console) } = {}) {
  if ((!Number.isInteger(amount)) || amount < 2) amount = 1

  const node0 = await make_node({ port: 10000, ephemeral: false, bootstrap: [] })
  const info0 = info(node0)

  const bootstrap_nodes = [{ host: info0.address.host, port: info0.address.port }]


  for (var i = 0; i < amount; i++) {
    const node = await make_node({ port: 10001 + i, ephemeral: false, bootstrap: bootstrap_nodes })
    const meta = info(node)
    bootstrap_nodes.push({ host: meta.address.host, port: meta.address.port })
  }

  log('bootstrap_nodes', ...bootstrap_nodes)
  return bootstrap_nodes
}

async function make_node ({ port = 10000, ephemeral = true, bootstrap = [] }) {
  const node = new DHT({ bootstrap, ephemeral, firewalled: false })
  await node.bind(port)
  return node
}

function info (node) {
  const pk = node.defaultKeyPair.publicKey.toString('hex')
  const sk = node.defaultKeyPair.secretKey.toString('hex')
  // Your DHT routing id is hash(publicIp + publicPort) and will be autoconfigured internally.
  const id = node.table.id.toString('hex')
  const { address: host, port } = node.address()
  return { id, pk, sk, address: { host, port } }
}