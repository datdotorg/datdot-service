const fetch = require('node-fetch')
const fs = require('fs')
const types = JSON.parse(fs.readFileSync('./src/types.json').toString())
const Hypercore = require('hypercore')
const hyperswarm = require('hyperswarm')
const swarm = hyperswarm()
const ram = require('random-access-memory')
var hypercore = new Hypercore(_ => ram())

const colors = require('colors/safe');
const NAME = __filename.split('/').pop().split('.')[0].toUpperCase()
const ERROR = `404 - not found`
let hypercoreArr = []
function LOG (...msgs) {
  msgs = [`[${NAME}] `, ...msgs].map(msg => colors.red(msg))
  console.log(...msgs)
}

/*-------------------------------------------------------------------------

                                DATA

------------------------------------------------------------------------ */
getHypercore()

/*----------  get hypercoreArr ------------ */

function getHypercore () {
  var demo = {
  	"Node": {
  		"index": "u64",
  		"hash": "H256",
  		"size": "u64"
  	},
    "Nod1e": {
      "index": "u64",
      "hash": "H256",
      "size": "u64"
    },
    "Node3": {
      "index": "u64",
      "hash": "H256",
      "size": "u64"
    },
  	"Proof": {}
  }
  const data = Buffer.from(JSON.stringify(demo), 'utf8')
  hypercore.append(data)

  hypercore.ready(() => {
    getKey()
  })


  function getKey () {
    var address = hypercore.key.toString('hex')
    LOG(`Key: ${address}`)
    fetch(`http://localhost:8989/feed1?dat=${address}`)
      .then(response => response.status === 404 ? ERROR : response.text())
    LOG('published')
    hypercoreArr.push(hypercore.key.toString('hex')) // ed25519::Public
    getRootHash(hypercoreArr)
  }
  function getRootHash (hypercoreArr) {
    const index = hypercore.length - 1
    const childrenArr = []
    hypercore.rootHashes(index, (err, res) => {
      if (err) LOG(err)
      res.forEach(root => {
        childrenArr.push({
          hash: root.hash,
          hash_number: root.index,
          total_length: root.size
        })
      })
      hypercoreArr.push({
        hashType: 2, // u8 <= hard coded (internal substrate id)
        children: childrenArr //  Vec<ParentHashInRoot>
      })
      getSignature(hypercoreArr)
    })
  }
  function getSignature (hypercoreArr) {
    hypercore.signature((err, res) => {
      if (err) LOG(err)
      hypercoreArr.push(res.signature.toString('hex')) // ed25519::Signature
      joinSwarm()
    })
  }

  function joinSwarm() {
    const key = hypercore.key
    LOG(`Hypercore key is ${key.toString('hex')}`)
    swarm.join(key, {
      lookup: true, // find & connect to peers
      announce: true // optional- announce self as a connection target
    })
    swarm.on('connection', function (socket, info) {
      // LOG(colors.red(`[${NAME}] ` + `New connection`))
      socket.pipe(hypercore.replicate(info.client)).pipe(socket)
    })
  }
}
