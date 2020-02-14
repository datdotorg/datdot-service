const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api')
const { randomAsU8a } = require('@polkadot/util-crypto') // make sure version matches api version
const provider = new WsProvider('ws://127.0.0.1:9944')
const fs = require('fs')
const types = JSON.parse(fs.readFileSync('./src/types.json').toString())
const hypercore = require('hypercore')
const crypto = require('hypercore-crypto')
const hyperswarm = require('hyperswarm')
const swarm = hyperswarm()

/* -- todo: create feed loader/saver -- */
const testfeed = hypercore('./feed', { valueEncoding: 'binary' })
const feedqueue = [testfeed]
const feeds = { }

/* -------------------------------------------------------------------------

                                DATA

------------------------------------------------------------------------ */
getApi()
// getArchive(null, feed)
/* ----------  get api ------------ */

function initFeed (feed) {
  var demo = {
  	Node: {
  		index: 'u64',
  		hash: 'H256',
  		size: 'u64'
  	},
    Nod1e: {
      index: 'u64',
      hash: 'H256',
      size: 'u64'
    },
    Node3: {
      index: 'u64',
      hash: 'H256',
      size: 'u64'
    },
  	Proof: {}
  }
  const foo = Buffer.from(JSON.stringify(demo), 'utf8')
  feed.append(foo)
}

async function getApi () {
  const API = await ApiPromise.create({
    provider,
    types
  })
  getArchives(API, feedqueue)
}
/* ----------  get archiveArr ------------ */

function getArchives (api, queue) {
  for (const i in queue) {
    const core = queue[i]
    const registerPayload = []
    core.ready(() => {
      if (core.length === 0) {
        initFeed(core)
      }
      getKey(core, registerPayload)
    })
  }

  function getKey (feed, registerPayload) {
    registerPayload.push(feed.key) // ed25519::Public
    feeds[feed.key.toString('hex')] = feed
    getRootHash(registerPayload, feed)
  }
  function getRootHash (archiveArr, feed) {
    const index = feed.length - 1
    console.log('root hash: ' + feed.digest())
    const childrenArr = []
    feed.rootHashes(index, (err, res) => {
      if (err) console.log(err)
      res.forEach(root => {
        childrenArr.push({
          hash: root.hash,
          hash_number: root.index,
          total_length: root.size
        })
      })
      archiveArr.push({
        hashType: 2, // u8 <= hard coded (internal substrate id)
        children: childrenArr //  Vec<ParentHashInRoot>
      })
      getSignature(archiveArr, feed)
    })
  }
  function getSignature (archiveArr, feed) {
    feed.signature((err, res) => {
      if (err) console.log(err)
      archiveArr.push(res.signature) // ed25519::Signature
      start(api, archiveArr)
      joinSwarm(feed)
    })
  }

  function joinSwarm (feed) {
    const key = feed.key
    swarm.join(key, {
      lookup: true, // find & connect to peers
      announce: true // optional- announce self as a connection target
    })
    swarm.on('connection', function (socket, info) {
      console.log('New connection')
      socket.pipe(feed.replicate(info.client)).pipe(socket)
    })
  }
}

async function promiseRerun (promise) {
  var success = true
  do {
    return promise.catch((e) => {
      success = false
      console.error(e)
      console.log('Retrying!')
    })
  } while (!success)
}

/* -------------------------------------------------------------------------

                                START

------------------------------------------------------------------------ */

async function start (api, archiveArr) {
  console.log('Archive array is: ', archiveArr)
  /* ----------  chain & node information via rpc calls ------------ */

  const [chain, nodeName, nodeVersion] = await Promise.all([
    api.rpc.system.chain(),
    api.rpc.system.name(),
    api.rpc.system.version()
  ])
  console.log(`You are connected to chain ${chain} using ${nodeName} v${nodeVersion}`)

  /* -------------------------------------------------------------------------

                                  ACCOUNTS

  ------------------------------------------------------------------------ */

  // default accounts in dev env (ALICE, CHARLIE, DAVE, FERDIE, EVE etc.)
  // todo: create account loader/saver
  const keyring = new Keyring({ type: 'sr25519' })

  const ALICE = keyring.addFromUri('//Alice')
  const CHARLIE = keyring.addFromUri('//Charlie')
  const FERDIE = keyring.addFromUri('//Ferdie')
  const EVE = keyring.addFromUri('//Eve')
  const DAVE = keyring.addFromUri('//Dave')
  // // create a new account
  const NEW_ACCOUNT = keyring.addFromSeed(randomAsU8a(32))
  console.log('New account created with address: ', NEW_ACCOUNT.address)

  const keypairs = [ALICE, CHARLIE, DAVE, EVE, FERDIE, NEW_ACCOUNT]

  /* ------------------------------------------------------------------------

                                 EXTRINSICS

---------------------------------------------------------------------------- */

  /* -------------------------  TRANSACTIONS -------------------------------- */

  /* ---   registerSeeder()  --- */

  const registerSeeder = api.tx.datVerify.registerSeeder()
  await promiseRerun(registerSeeder.signAndSend(ALICE, ({ events = [], status }) => {
    console.log('Registering user: ', status.type)
    if (status.isFinalized) {
      events.forEach(({ phase, event: { data, method, section } }) => {
        console.log('\t', phase.toString(), `: ${section}.${method}`, data.toString())
      })
    }
  }))

  await promiseRerun(registerSeeder.signAndSend(CHARLIE, ({ events = [], status }) => {
    if (status.isFinalized) {
      events.forEach(({ phase, event: { data, method, section } }) => {
        console.log('\t', phase.toString(), `: ${section}.${method}`, data.toString())
      })
    }
  }))

  await promiseRerun(registerSeeder.signAndSend(FERDIE, ({ events = [], status }) => {
    if (status.isFinalized) {
      events.forEach(({ phase, event: { data, method, section } }) => {
        console.log('\t', phase.toString(), `: ${section}.${method}`, data.toString())
      })
    }
  }))

  await promiseRerun(registerSeeder.signAndSend(DAVE, ({ events = [], status }) => {
    if (status.isFinalized) {
      events.forEach(({ phase, event: { data, method, section } }) => {
        console.log('\t', phase.toString(), `: ${section}.${method}`, data.toString())
      })
    }
  }))

  await promiseRerun(registerSeeder.signAndSend(EVE, ({ events = [], status }) => {
    if (status.isFinalized) {
      events.forEach(({ phase, event: { data, method, section } }) => {
        console.log('\t', phase.toString(), `: ${section}.${method}`, data.toString())
      })
    }
  }))

  /* ---   registerData(archiveArr)  --- */

  const registerData = api.tx.datVerify.registerData(archiveArr)
  await promiseRerun(registerData.signAndSend(ALICE, async ({ events = [], status }) => {
    console.log('Registering data: ', status.type)
    if (status.isFinalized) {
      events.forEach(({ phase, event: { data, method, section } }) => {
        console.log('\t', phase.toString(), `: ${section}.${method}`, data.toString())
      })
      getUsersStorage()
    }
  }))

  async function getUsersStorage () {
    const [a, c, f, d, e] = await Promise.all([
      await api.query.datVerify.usersStorage(ALICE.address),
      await api.query.datVerify.usersStorage(CHARLIE.address),
      await api.query.datVerify.usersStorage(FERDIE.address),
      await api.query.datVerify.usersStorage(DAVE.address),
      await api.query.datVerify.usersStorage(EVE.address)
    ])
    console.log('Alice is hosting: ', a.length)
    console.log('Charlie is hosting: ', c.length)
    console.log('Ferdie is hosting: ', f.length)
    console.log('Dave is hosting: ', d.length)
    console.log('Eve is hosting: ', e.length)
  }

  /* -- get and respond to challenges for selected users -- */

  const getChallengesMulti = async function getCurrentChallengesMulti (users) {
    const challenges = await api.query.datVerify.challengeMap()
    const respondingChallenges = []
    for (const userIndex in users) {
      const user = users[userIndex]
      const userChallengeTuple = await api.query.datVerify.selectedUserIndex(user.address)
      if (userChallengeTuple[1].eq(0)) continue // if user has no challenges - skip them
      const userChallengeIndex = userChallengeTuple[0] // this is the user's ID in the challenge context
      const userChallengePromises = await Promise.all(challenges.map(async function (challengeIndex, index) {
        if (challenges[1][index]) {
          if (challenges[1][index].eq(userChallengeIndex)) {
            const challengeDetailsTuple = await api.query.datVerify.selectedChallenges(challengeIndex)
            const challengeDetails = challengeDetailsTuple.toJSON()
            challengeDetails[3] = challengeIndex
            return challengeDetails.flat()
          }
        }
      }
      ))
      const userChallengeUnfiltered = await Promise.all(userChallengePromises)
      const userChallenges = userChallengeUnfiltered.filter((e) => {
        return e
      })
      if (userChallenges.length) {
        for (const i in userChallenges) {
          const challengeDetails = userChallenges[i]
          const challengeObject = { }
          challengeObject.user = user
          challengeObject.pubkey = challengeDetails[0]
          challengeObject.index = challengeDetails[1]
          challengeObject.deadline = challengeDetails[2]
          challengeObject.challengeIndex = challengeDetails[3]
          respondingChallenges.push(challengeObject)
        }
      }
    }
    return respondingChallenges
  }

  const challengeResponse = async function respondToChallenges (challengeObjects) {
    for (const i in challengeObjects) {
      const challenge = challengeObjects[i]
      console.log(challenge)
      const user = challenge.user
      const pubkey = challenge.pubkey.slice(2)
      const deadline = challenge.deadline
      const challengeIndex = challenge.challengeIndex
      const feed = feeds[pubkey]
      let index = {}
      let err = {}
      let merkleRoot = {}
      feed.seek(challenge.index, async function (e, offsetIndex, offset) {
        index = offsetIndex
        err = e
        feed.rootHashes(index, async function (e, roots) {
          err = e
          merkleRoot = crypto.tree(roots)
          feed.get(index, async function (e, chunk) {
            err = e
            console.log('CHUNK: ' + chunk.toString('hex'))
            feed.proof(index, async function (e, nodes) {
              err = e
              if (nodes && chunk) {
                console.log(nodes)
                const challengeResponseExt = api.tx.datVerify.submitProof(challengeIndex, nodes, merkleRoot, chunk.toString('hex'))
                console.log(api.signer)
                await promiseRerun(challengeResponseExt.signAndSend(user, ({ events = [], status }) => {
                  if (status.isFinalized) {
                    events.forEach(({ phase, event: { data, method, section } }) => {
                      console.log('\t', phase.toString(), `: ${section}.${method}`, data.toString())
                    })
                  }
                })).catch(console.log)
              }
            })
          })
        })
        if (e) {
          console.log('Failed to complete challenge for chunk: ' + index.toString() + '/' + feed.length)
          console.log('Reason: ')
          console.log(err)
        }
      })
    }
  }

  /* ----------  listen to blocks ------------ */
  let count = 0

  const unsubscribe = await api.rpc.chain.subscribeNewHeads((header) => {
    console.log(`Chain is at block: #${header.number}`)
    const challenges = getChallengesMulti(keypairs)
    challenges.then(challengeResponse)
    challenges.catch(console.log)
    if (++count === 256) {
      unsubscribe()
      process.exit(0)
    }
  })
}
