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

// --------------------------------------------------//

// MAKE ACCOUNT
chainAPI.makeAccount(opts, (err, confirmation) => {
  LOG(confirmation) // account.address, account.id
})

// GIVE (dots or storage)
const opts = { type: 'storage', amount: 250}
chainAPI.give(opts, (err, confirmation) => {
  LOG(confirmation) // from, to, amount, new saldo
}

// REGISTER FEED
const feed = { feedkey: '', swarmkey: '' }
getData( feed, (err, roots) => {
  const { feedkey, swarmkey } = feed
  const data = { feedkey, swarmkey, roots }
  chainAPI.publishData(data, (err, confirmation) => {
    LOG(confirmation)
  })
})

// REQUEST SERVICE

const request = {}
chainAPI.requestHosting(request, (err, confirmation) => {
  LOG(confirmation) // get confirmation => update dashboard
})

// REGISTER & PROVIDE SERVICE (hosting. encoding, attesting, validating)

const opts = {}

// ENCODING
chainAPI.registerEncoder(opts, (err, request) => {
  const { feedkey, swarmkey, eid, hid} = request // eid = encoder id
  serviceAPI.encode(request, (err, merkleRoot) => {
    chainAPI.encodingDone(merkleRoot, (err, res) => {
      LOG(res) // your new ratio is: ...
    })
  })
}

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

// ATTEST

chainAPI.registerAttester(opts, (err, request) => {
  serviceAPI.attest(request, (err, report) => {
    chainAPI.attestation(report, (err, res) => {
      LOG(res)
    })
  })
}

// VALIDATE

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
        hash: root.hash,
        signature: getSignature(root.index),
        length: root.size
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




/* --------------------------------------
              A. SETUP FLOW
----------------------------------------- */

// 1. Get substrate chain API
async function setup () {
  const chainAPI = await chainAPI_promise
  const serviceAPI = await serviceAPI_promise
  makeAccount(chainAPI, serviceAPI)
}
setup()

// 2. `make ACCOUNT`
async function makeAccount(chainAPI, serviceAPI) {
  const opts = {chainAPI, serviceAPI, cb: start}
  chainAPI.makeAccount(opts)
}

async function start (chainAPI, serviceAPI, accounts) {


  /* --------------------------------------
  B. LISTEN TO EVENTS
  ----------------------------------------- */

  await chainAPI.on(handleEvents)

  function handleEvents (event) {
    if (event.method === 'Challenge') {
      LOG('NEW CHALLENGE', event.data.toString())
      const account = event.data[0]
      getChallenges(account)
    }
    // if (event.method === 'ChallengeFailed') {
    //   LOG('CHALLENGE FAILED', event.data.toString())
    // }
    // if (event.method === 'AttestPhase') {
    //   LOG('NEW ATTEST PHASE:', event.method)
    //   attestPhase()
    // }
  }

  /* --------------------------------------
            B. COMMIT FLOW
  ----------------------------------------- */

  // 1. `publish DATA`

  async function publishData () {
    // function getFeed (feedKey) {
    //     return { feedKey, swarmKey}
    // }
    const hypercoreArr = (await hypercoreArr_promise)[0]
    const opts = {
      registerPayload: hypercoreArr,
      account: accounts[0],
      handlePublishing
    }
    await chainAPI.publishData(opts)
  }
  publishData()

    /* --------------------------------------
          C. REGISTERING FLOW
    ----------------------------------------- */

    // 1. `register HOSTER`
    async function registerHoster() {
      const opts = {accounts, handleRegisterHoster}
      await chainAPI.registerHoster(opts)
    }

    // 2. `register ENCODER`

    // 3. `register ATTESTER`

    /* --------------------------------------
              D. REQUEST HOSTING
    ----------------------------------------- */


    /* --------------------------------------
              E. CHALLENGES FLOW
    ----------------------------------------- */

    async function getChallenges (address) {
      const opts = {users: accounts, respondToChallenges}
      await chainAPI.getChallenges(opts)
    }
    // async function getChallenges (address) {
    //   const opts = {address, respondToChallenges}
    //   await chainAPI.getChallenges(opts)
    // }

    async function respondToChallenges (respondingChallenges) {
      const feeds = (await hypercoreArr_promise)[1]
      const opts = {challengeObjects: respondingChallenges, feeds}
      await chainAPI.respondToChallenges(opts)
    }


    /* --------------------------------------
              E. ATTEST PHASE
    ----------------------------------------- */

    async function attestPhase () {
      await chainAPI.attest()
    }

    /* --------------------------------------
              F. EVENTS
    ----------------------------------------- */

    function handleRegisterHoster (user, events) {
      events.forEach(async (record) => {
        const event = record.event
        LOG(`registerHoster event for user: ${user}`, event.method, event.data.toString())
      })
    }
    function handlePublishing (user, events) {
      events.forEach(async (record) => {
        const event = record.event
        LOG(`publishData event for user: ${user}`, event.method, event.data.toString())
        if (event.method === 'SomethingStored') {
          registerHoster()
        }
        if (event.method === 'NewPin') {
          LOG('Handling publishing - new pin: ', event.data)
        }
      })
    }

}


// ----------------------------------------------------------------------------
// 1a. `request HOSTING`
// @NOTE: requesting HOSTING is "opt in"
// const opts = {
//   // backing: '0', // e.g. `0-100%` and/or hypercore "chunk ranges"
//   address: hypercore.key
// }
// const signature = sign(opts, myAccount)
// chainAPI.offerBacking(opts, signature, handleBacking)
// function handleBacking (event) {
//   const handle = {
//     success : event => console.log(`done! => dashboard update: ${event} ${hypercore.key} ${myAccount} ${opts}`),
//     fail    : event => console.error('oops, something went wrong', event)
//     request : event => { /* @TODO: handle backing requests */ }
//   }
//   return (handle[event.type] || handle.fail)(event)
// }

// async function registerHosting(accounts) {
//   chainAPI.publishData()
// }
// registerHosting(accounts)

// // ----------------------------------------------------------------------------
// // 1b. `offer ENCODING`
// // @NOTE: offering ENCODING is "opt out"
// // => every account offers encoding by default
// const opts = {}
// chainAPI.offerEncoding(opts, signature, protocolEncoding)
// // @LATER:
// // chainAPI.abortEncoding(myAccountId) // start again with `.offerEncoding`
// // chainAPI.pauseEncoding(myAccountId) // resume with `.offerEncoding`
// function protocolEncoding (event) {
//   const handle = {
//     success : event => console.log('done'),
//     fail    : event => console.error('oops, something went wrong', event),
//     encode  : event => handleEncoding(event)
//   }
//   return (handle[event.type] || handle.fail)(event)
// }
//
// // ----------------------------------------------------------------------------
// // 1c. `offer HOSTING`
// // @NOTE: offering HOSTING is "opt in"
// const opts = {}
// chainAPI.offerHosting(opts, signature, protocolHosting)
// // @LATER:
// // chainAPI.abortHosting(myAccountId) // start again with `.offerHosting`
// // chainAPI.pauseHosting(myAccountId) // resume with `.offerHosting`
// function protocolHosting (event) {
//   const handle = {
//     success : event => console.log('done'),
//     fail    : event => console.error('oops, something went wrong', event),
//     hosting : event => handleHosting(event)
//   }
//   return (handle[event.type] || handle.fail)(event)
// }
//
//
// // ----------------------------------------------------------------------------
// // 2a. `handle ENCODING`
//
// /*
// const search = (event, find) => find(event)
// const dig = (event, find) => find(event)
//
// const query = { path, scan }
//
// const query = { path, probe }
//
// const query = { path, quest }
//
// const query = { path, study }
//
// const query = { path, inspect }
//
// const query = { path, seek }
//
// const query = { path, study }
//
// claim
// assert
// test
// verify
//
// question
// ask
// request
// give
//
// response
// reply
//
// seek
// inquiry
// probe
// quiz
//
// challenge
// check
//
// poke
// sift
// inquest
// audit
// call
//
//
// */
// function handleEncoding (event) {
//   var { signer: hosterID, feed: address } = event
//
//   const scan = ({ signer, feed }, done) => signer === hosterID && feed === address ? done(event) : void 0
//   const query = { type: 'hosting', scan }
//   const query = ['hosting', scan]
//   const off = chainAPI.on(['hosting', query], event => {
//     var { AccountId, feedKey: feedID } = event
//     if (AccountId === hosterID && feedID === feedKey) { // if hoster is ready
//       cleanup() // deletes original and encoded data (from memory/disk)
//       chainAPI.offHosting(feedKey) // @NOTE: stop listening
//     }
//   })
//   off.then()
//
//   var swarmE = hyperswarm()
//   var feedE = hypercore() // @NOTE: use memory
//   // @TODO: optimize, by not storing on disk, but forwarding directly
//   var swarm = hyperswarm()
//   var feed = hypercore(feedKey) // @NOTE: use memory
//
//   feed.on('ready', () => feedE.on('ready', () => start()))
//
//   function start () {
//     swarmE.join(hosterID, { announce: true })
//     swarmE.on('connection', s => s.pipe(feedE.replicate(false)).pipe(s))
//     swarm.join(feed.key, { lookup: true })
//     swarm.on('connection', s => s.pipe(feed.replicate(true)).pipe(s))
//
//     feed.createReadStream().on('data', chunk => {
//       compress(chunk, (err, chunkE) => feedE.append(chunkE)
//     }).on('end', () => {
//       // @TODO: notify the chain (done(encodedMerkleRoot))
//       var merkleRootE = feedE.getMerkleRoot()
//       chainAPI.commit(myAccountId, event, merkleRootE)
//     })
//   }
// }
//
//
// // ----------------------------------------------------------------------------
// // 2b. `handle HOSTING`
// function handleHosting (event) {
//   var { encoderID, feedKey } = event
//
//   chainAPI.onHosting(feedKey, event => {
//     var { AccountId, feedKey: feedID } = event
//     if (AccountId === hosterID && feedID === feedKey) {
//       cleanup() // close and delete `swarmE` and `feedE`
//       chainAPI.offHosting(feedKey) // @NOTE: stop listening
//     }
//   })
//
//   var swarmE = hyperswarm()
//   var feedE = hypercore(encoderID) // @NOTE: use memory
//
//   var swarm = hyperswarm()
//   var feed = hypercore(feedKey) // @NOTE: use disk
//
//   feed.on('ready', () => feedE.on('ready', () => start()))
//
//   function start () {
//     swarmE.join(feedE.key, { lookup: true })
//     swarmE.on('connection', s => s.pipe(feedE.replicate(true)).pipe(s))
//     swarm.join(feed.key, { announce: true })
//     swarm.on('connection', s => s.pipe(feed.replicate(true)).pipe(s))
//
//     feedE.createReadStream().on('data', chunkE => {
//       decompress(chunkE, (err, chunk) => feed.append(chunk)
//     }).on('end', () => {
//       var merkleRootE = feedE.getMerkleRoot()
//       chainAPI.commit(myAccountId, event, merkleRootE)
//     })
//   }
// }
//
//
// // ----------------------------------------------------------------------------
// // 2. SERVE
// // `@TODO` implement challenge process for attesters
