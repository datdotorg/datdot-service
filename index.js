const { ApiPromise, WsProvider, Keyring, ApiRx } = require("@polkadot/api")
const provider = new WsProvider('ws://127.0.0.1:9944')
const fs = require('fs')
const types = JSON.parse(fs.readFileSync('./src/types.json').toString())
const hypercore = require('hypercore')
var feed = hypercore('./tmp', {valueEncoding: 'json'})
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
  feed.append({
    hello: 'world'
  })

  feed.append({
    hej: 'verden'
  })

  feed.append({
    hola: 'mundo'
  })
  feed.ready(() => {
    getKey()
  })
  function getKey () {
    archiveArr.push(feed.key.toString('hex')) // ed25519::Public
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
      archiveArr.push(res.signature.toString('hex')) // ed25519::Signature
      start(api, archiveArr)
    })
  }
}

/*-------------------------------------------------------------------------

                                START

------------------------------------------------------------------------ */

async function start (api, archiveArr) {

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

  // // create a new account
  const { randomAsU8a } = require('@polkadot/util-crypto')
  const NEW_ACCOUNT = keyring.addFromSeed(randomAsU8a(32))
  console.log('New account created with address: ', NEW_ACCOUNT.address)


  /* ------------------------------------------------------------------------

                                 EXTRINSICS

---------------------------------------------------------------------------- */


  /*-------------------------  TRANSACTIONS -------------------------------- */


  /* ---   registerSeeder()  ---*/

  const registerSeeder = api.tx.datVerify.registerSeeder()
  const hash_Seeder1 = await registerSeeder.signAndSend(ALICE, ({ events = [], status }) => {
    console.log(`Registering user: `, status.type)
    if (status.isFinalized) getUsersCount()
  })

  const hash_Seeder2 = await registerSeeder.signAndSend(CHARLIE, ({ events = [], status }) => {
    console.log(`Registering user: `, status.type)
    if (status.isFinalized) getUsersCount()
  })

  const hash_Seeder3 = await registerSeeder.signAndSend(FERDIE, ({ events = [], status }) => {
    console.log(`Registering user: `, status.type)
    if (status.isFinalized) getUsersCount()
  })
  const hash_Seeder4 = await registerSeeder.signAndSend(DAVE, ({ events = [], status }) => {
    console.log(`Registering user: `, status.type)
    if (status.isFinalized) getUsersCount()
  })
  const hash_Seeder5 = await registerSeeder.signAndSend(EVE, ({ events = [], status }) => {
    console.log(`Registering user: `, status.type)
    if (status.isFinalized) getUsersCount()
  })

  async function getUsersCount () {
    usersCount = await api.query.datVerify.usersCount()
    console.log('UsersCount is: ', usersCount)
  }

  /* ---   registerData(archiveArr)  ---*/

  // Get the nonce for the admin key
  const registerData = api.tx.datVerify.registerData(archiveArr)

  const hashData = await registerData.signAndSend(ALICE, async ({ events = [], status }) => {
    console.log(`Registering data: `, status.type)
    if (status.isFinalized) {
      getDatHosters()
      getUsersStorage()
    }
  })

  async function getUsersStorage () {
    const [a, c, f, d, e, ] = await Promise.all([
      await api.query.datVerify.usersStorage(ALICE.address),
      await api.query.datVerify.usersStorage(CHARLIE.address),
      await api.query.datVerify.usersStorage(FERDIE.address),
      await api.query.datVerify.usersStorage(DAVE.address),
      await api.query.datVerify.usersStorage(EVE.address)
    ])
    console.log(a.length, c.length, f.length, d.length, e.length)
    console.log('Alice is hosting: ', a.forEach(el => console.log(el)))
    console.log('Charlie is hosting: ', c.forEach(el => console.log(el)))
    console.log('Ferdie is hosting: ', f.forEach(el => console.log(el)))
    console.log('Dave is hosting: ', d.forEach(el => console.log(el)))
    console.log('Eve is hosting: ', e.forEach(el => console.log(el)))
  }

  async function getDatHosters () {
    const datHosters = await api.query.datVerify.datHosters(feed.key.toString('hex'))
    console.log(datHosters.length)
    datHosters.forEach(el => console.log('Hosters for this archive: ', el))
  }


}
