const hypercoreArr_promise = require('helpers/getHypercoreArr')
const chainAPI_promise = require('datdot-chain/index') // to use substrate node
const serviceAPI_promise = require('datdot-service/index') // to use dat stuff
const Hypercore = require('hypercore')
const ram = require('random-access-memory')
const hyperswarm = require('hyperswarm')
const swarm = hyperswarm()

const colors = require('colors/safe');
const NAME = __filename.split('/').pop().split('.')[0].toUpperCase()
function LOG (...msgs) {
  msgs = [`[${NAME}] `, ...msgs].map(msg => colors.green(msg))
  console.log(...msgs)
}

/*

*/

// --------------------------------------------------
// MAKE ACCOUNT
chainAPI.makeAccount(opts, (err, confirmation) => {
  LOG(confirmation) // account.address, account.id
})

// --------------------------------------------------
// REGISTER FEED
const feed = { feedkey: '', swarmkey: '' }
getData( feed, (err, roots) => {
  const { feedkey, swarmkey } = feed
  const data = { feedkey, swarmkey, roots }
  chainAPI.publishData(data, (err, confirmation) => {
    LOG(confirmation)
  })
})

// --------------------------------------------------
// REQUEST SERVICE
const request = {}
chainAPI.requestHosting(request, (err, confirmation) => {
  LOG(confirmation) // get confirmation => update dashboard
})

// --------------------------------------------------
// ENCODING
chainAPI.registerEncoder(opts, (err, request) => {
  const { feedkey, swarmkey, eid, hid} = request // eid = encoder id
  serviceAPI.encode(request, (err, merkleRoot) => {
    chainAPI.encodingDone(merkleRoot, (err, res) => {
      LOG(res) // your new ratio is: ...
    })
  })
})

// --------------------------------------------------
// HOSTING
chainAPI.registerHoster(opts, (err, request) => {
  // request encoder
  const { feedkey, swarmkey, eid, hid} = request // eid = encoder id
  serviceAPI.host(request, (err, merkleRoot, next) => {
    if (err ==='encoder time out') chainAPI.requestNewEncoder(request,  (encoder) => {
      const { id } = encoder
      next(encoder)
    })
    chainAPI.hostingStarted(merkleRoot, (err, challenge) => {
      serviceAPI.solveChallenge(challenge, (err, merkleProof) => {
        chainAPI.provideProofOfHosting(merkleProof, (err, res) => {
          LOG(res)
        })
      })
    })
  })
})

// --------------------------------------------------
// ATTEST

chainAPI.registerAttester(opts, (err, request) => {
  serviceAPI.attest(request, (err, report) => {
    chainAPI.attestation(report, (err, res) => {
      LOG(res)
    })
  })
})

// --------------------------------------------------
// VALIDATE

// --------------------------------------------------
// HELPERS

function getData (opts, cb) {
  const { feedkey, feedswarm } = opts
  const feed = new Hypercore(ram, swarmkey)
  swarm.join(swarmkey, { lookup: true })
  swarm.on('connection',(socket, info) => {
    const index = feed.length - 1
    feed.rootHashes(index, (err, res) => {
      if (err) return LOG(err)
      const roots = res.map(hash => {
        root.hash,
        getSignature(root.index),
        root.size
      })
    })
    function getSignature (idx) {
      feed.signature(idx, (err, res) => {
        if (err) return LOG(err)
        return signature
      })
    }
  })
  cb(roots)
}
