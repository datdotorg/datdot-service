const { ApiPromise, WsProvider, Keyring, ApiRx } = require("@polkadot/api")
const provider = new WsProvider('ws://127.0.0.1:9944')
const { randomAsU8a } = require('@polkadot/util-crypto') // make sure version matches api version
const fs = require('fs')
const types = JSON.parse(fs.readFileSync('./src/types.json').toString())
const hypercore = require('hypercore')
const hyperswarm = require('hyperswarm')
const swarm = hyperswarm()
var feed = hypercore('./feed', {valueEncoding: 'binary'})
let archiveArr = []

/*-------------------------------------------------------------------------

                                DATA

------------------------------------------------------------------------ */
getApi()
/*----------  get api ------------ */

async function getApi () {
  const API = await ApiPromise.create({
    provider,
    types
  })
  getArchive(API, feed)
}
/*----------  get archiveArr ------------ */

function getArchive (api, feed) {
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
  const foo = Buffer.from(JSON.stringify(demo), 'utf8')
  feed.append(foo)

  feed.ready(() => {
    getKey()
  })


  function getKey () {
    archiveArr.push(feed.key) // ed25519::Public
    getRootHash(archiveArr)
  }
  function getRootHash (archiveArr) {
    const index = feed.length - 1
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
      getSignature(archiveArr)
    })
  }
  function getSignature (archiveArr) {
    feed.signature((err, res) => {
      if (err) console.log(err)
      archiveArr.push(res.signature) // ed25519::Signature
      start(api, archiveArr)
    })
  }

}

/*-------------------------------------------------------------------------

                                START

------------------------------------------------------------------------ */

async function start (api, archiveArr) {


    /*-------------------------  EVENTS -------------------------------- */

    listenToEvents()


  console.log('Archive array is: ', archiveArr)

  /*----------  chain & node information via rpc calls ------------ */

  const [chain, nodeName, nodeVersion] = await Promise.all([
    api.rpc.system.chain(),
    api.rpc.system.name(),
    api.rpc.system.version()
  ])
  console.log(`You are connected to chain ${chain} using ${nodeName} v${nodeVersion}`)

  /*----------  listen to blocks ------------ */
  let count = 0

  const unsubscribe = await api.rpc.chain.subscribeNewHeads((header) => {
    console.log(`Chain is at block: #${header.number}`)

    if (++count === 256) {
      unsubscribe()
      process.exit(0)
    }
  })

  /*-------------------------------------------------------------------------

                                  ACCOUNTS

  ------------------------------------------------------------------------ */

  // default accounts in dev env (ALICE, CHARLIE, DAVE, FERDIE, EVE etc.)
  const keyring = new Keyring({ type: 'sr25519' })

  const ALICE = keyring.addFromUri('//Alice')
  const CHARLIE = keyring.addFromUri('//Charlie')
  const FERDIE = keyring.addFromUri('//Ferdie')
  const EVE = keyring.addFromUri('//Eve')
  const DAVE = keyring.addFromUri('//Dave')

  console.log('Alice', ALICE.address)
  // // create a new account
  const NEW_ACCOUNT = keyring.addFromSeed(randomAsU8a(32))
  console.log('New account created with address: ', NEW_ACCOUNT.address)

  /* ------------------------------------------------------------------------

                                 EXTRINSICS

---------------------------------------------------------------------------- */

  /*-------------------------  TRANSACTIONS -------------------------------- */

  /* ---   registerSeeder()  ---*/

  const registerSeeder = api.tx.datVerify.registerSeeder()
  await registerSeeder.signAndSend(ALICE, ({ events = [], status }) => {
    console.log(`Registering user: `, status.type)
    if (status.isFinalized) {
      events.forEach(({ phase, event: { data, method, section } }) => {
        console.log('\t', phase.toString(), `: ${section}.${method}`, data.toString());
      });
    }
  })

  await registerSeeder.signAndSend(CHARLIE, ({ events = [], status }) => {
    if (status.isFinalized) {
      events.forEach(({ phase, event: { data, method, section } }) => {
        console.log('\t', phase.toString(), `: ${section}.${method}`, data.toString());
      });
    }
  })

  await registerSeeder.signAndSend(FERDIE, ({ events = [], status }) => {
    if (status.isFinalized) {
      events.forEach(({ phase, event: { data, method, section } }) => {
        console.log('\t', phase.toString(), `: ${section}.${method}`, data.toString());
      });
    }
  })
  await registerSeeder.signAndSend(DAVE, ({ events = [], status }) => {
    if (status.isFinalized) {
      events.forEach(({ phase, event: { data, method, section } }) => {
        console.log('\t', phase.toString(), `: ${section}.${method}`, data.toString());
      });
    }
  })
  await registerSeeder.signAndSend(EVE, ({ events = [], status }) => {
    if (status.isFinalized) {
      events.forEach(({ phase, event: { data, method, section } }) => {
        console.log('\t', phase.toString(), `: ${section}.${method}`, data.toString());
      });
    }
  })

  /* ---   registerData(archiveArr)  ---*/

  const registerData = api.tx.datVerify.registerData(archiveArr)

  await registerData.signAndSend(ALICE, async ({ events = [], status }) => {
    console.log(`Registering data: `, status.type)
    if (status.isFinalized) {
      events.forEach(({ phase, event: { data, method, section } }) => {
        console.log('\t', phase.toString(), `: ${section}.${method}`, data.toString());
      });
      // getDatHosters()
      // getUsersStorage()
      // SelectedChallenges()
      // getRequestor()
      // getSelectedChallenges(CHARLIE.address)
      // registerAttestor()
      // getMerkleRoot()
      usersCount()
    }
  })


  /* ---   getUsersStorage  ---*/
  async function getUsersStorage () {
    const [a, c, f, d, e, ] = await Promise.all([
      await api.query.datVerify.usersStorage(ALICE.address),
      await api.query.datVerify.usersStorage(CHARLIE.address),
      await api.query.datVerify.usersStorage(FERDIE.address),
      await api.query.datVerify.usersStorage(DAVE.address),
      await api.query.datVerify.usersStorage(EVE.address)
    ])
    console.log('Alice is hosting: ',a.length)
    console.log('Charlie is hosting: ',c.length)
    console.log('Ferdie is hosting: ',f.length)
    console.log('Dave is hosting: ',d.length)
    console.log('Eve is hosting: ',e.length)
  }

  async function getDatHosters () {
    const datHosters = await api.query.datVerify.datHosters(feed.key)
    console.log('Dat Hosters', datHosters.length)
    datHosters.forEach(el => console.log('Hosters for this archive: ', el.toString()))
  }

  async function getRequestor () {
    const userRequestsMap = await api.query.datVerify.userRequestsMap(feed.key)
    console.log('Requestor for this hypercore is:', userRequestsMap.toString())
  }

  /* ---   getSelectedChallenges  ---*/

  async function getSelectedChallenges (address) {
    const challengeIndeces = await getUserChallengeIndeces(address)
    challengeIndeces.forEach(async challengeIndex => {
      const challenge = await api.query.datVerify.selectedChallenges(challengeIndex)
      console.log('Challenge', challenge.toString())
      const archiveKey = challenge[0]
      const chunkNumber = challenge[1]
      const deadline = challenge[2]
      //do stuff
      //probably call submitProof()
    })
  }

  async function getUserChallengeIndeces (address) {
    const selectedUserIndex = await addressToSelectedUserIndex(address)
    const allChallenges = await api.query.datVerify.challengeMap()
    console.log('All challenges', allChallenges.toString()) //logs [[idsOfChallenges], [idsOfUsers]]
    const idsOfUsers = allChallenges[1]
    const userChallengeIndeces = []
    for (var i = 0; i < idsOfUsers.length; i++) {
      if (idsOfUsers[i].toString() === Number(selectedUserIndex).toString()) {
        userChallengeIndeces.push(i)
      }
    }
    console.log(`Indexes of all the challenges for user ${address}:`, userChallengeIndeces)
    return userChallengeIndeces
  }

  async function addressToSelectedUserIndex(address){
      const challengedUser = await api.query.datVerify.selectedUserIndex(address)
      const userIndex = challengedUser[0]
      const challengeCount = challengedUser[1]
      console.log("User: "+address+", at index: "+userIndex+" has "+challengeCount+" challenges!")
      return userIndex
  }

  /* ---   registerAttestor  ---*/

  async function registerAttestor () {
    const registerAttestor = api.tx.datVerify.registerAttestor()
    const hash = await registerAttestor.signAndSend(CHARLIE, ({ events = [], status }) => {
      console.log(`Registering user: `, status.type)
    })
  }

  /* ---   getMerkleRoot  ---*/

  async function getMerkleRoot () {
    const merkleRoot = await api.query.datVerify.merkleRoot(feed.key)
    console.log('Merkle root', merkleRoot.toString())
  }

  /* ---   usersCount  ---*/

  async function usersCount () {
    const usersCount = await api.query.datVerify.usersCount()
    console.log(usersCount.toString())
  }

  // async function listenToDatHosters () {
  //   api.query.system.events((events) => {
  //     console.log(`\nReceived ${events.length} events:`);
  //
  //     // Loop through the Vec<EventRecord>
  //     events.forEach((record) => {
  //       // Extract the phase, event and the event types
  //       const { event, phase } = record;
  //       const types = event.typeDef;
  //
  //       // Show what we are busy with
  //       console.log(`\t${event.section}:${event.method}:: (phase=${phase.toString()})`);
  //       console.log(`\t\t Meta documentation: ${event.meta.documentation.toString()}`);
  //
  //       // Loop through each of the parameters, displaying the type and data
  //       event.data.forEach((data, index) => {
  //         console.log(`\t\t\t${types[index].type}: ${data.toString()}`);
  //       });
  //     });
  //   });
  // }

  async function listenToEvents () {
    api.query.system.events((events) => {
      events.forEach(async (record) => {
        const event = record.event
        if (event.method === 'SomethingStored') {
            console.log(`DATA FROM EVENT: ${event.data.toString()}`)
            return(event.data)
        }
        if (event.method === 'NewPin') {
            console.log(`DATA FROM EVENT: ${event.data.toString()}`)
            return(event.data)
        }
      })
    })
  }


  }
