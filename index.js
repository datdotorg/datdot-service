const { ApiPromise, WsProvider, Keyring, ApiRx } = require("@polkadot/api")
const provider = new WsProvider('ws://127.0.0.1:9944')
const fs = require('fs')
const types = JSON.parse(fs.readFileSync('./src/types.json').toString())
const hypercore = require('hypercore')
var feed = hypercore('./tmp', {valueEncoding: 'json'})

// feed.append({
//   hello: 'world'
// })
// feed.append({
//   hej: 'verden'
// })
// feed.append({
//   hola: 'mundo'
// })
// console.log(feed)

start()
async function start () {

  const api = await ApiPromise.create({
    provider,
    types
  })

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
  // const hash_registerSeeder1 = await registerSeeder.signAndSend(ALICE)
  const hash_registerSeeder2 = await registerSeeder.signAndSend(CHARLIE, (res) => {
    console.log('Charlie registered as a seeder')
  })
  const hash_registerSeeder3 = await registerSeeder.signAndSend(FERDIE, (res) => {
    console.log('Ferdie registered as a seeder')
  })
  const hash_registerSeeder4 = await registerSeeder.signAndSend(DAVE, (res) => {
    console.log('Dave registered as a seeder')
  })
  const hash_registerSeeder5 = await registerSeeder.signAndSend(EVE, (res) => {
    console.log('Eve registered as a seeder')
  })

  /* ---   registerData(archive)  ---*/
  const archive = getArchive()
  const registerData = api.tx.datVerify.registerData(archive)
  //const hashData1 = await registerData.signAndSend(DAVE)

  // Get the nonce for the admin key
  const hashData1 = await registerData.signAndSend(DAVE, async (res) => {
    console.log('Dave registered the data he needs to be seeded')

    const [a, c, f, d, e, ] = await Promise.all([
      await api.query.datVerify.usersStorage(ALICE.publicKey),
      await api.query.datVerify.usersStorage(CHARLIE.publicKey),
      await api.query.datVerify.usersStorage(FERDIE.publicKey),
      await api.query.datVerify.usersStorage(DAVE.publicKey),
      await api.query.datVerify.usersStorage(EVE.publicKey)
    ])
    console.log(a.length, c.length, f.length, d.length, e.length)
    console.log('Alice is hosting: ', a.forEach(el => console.log(el)))
    console.log('Charlie is hosting: ', c.forEach(el => console.log(el)))
    console.log('Ferdie is hosting: ', f.forEach(el => console.log(el)))
    console.log('Dave is hosting: ', d.forEach(el => console.log(el)))
    console.log('Eve is hosting: ', e.forEach(el => console.log(el)))
    const datHosters = await api.query.datVerify.datHosters(feed.key.toString('hex'))
    console.log(datHosters.length)
    datHosters.forEach(el => console.log('Hosters for this archive: ', el))
  })
  // const nonce = await api.query.system.accountNonce(ALICE.address)
  // const hashData2 = await registerData.signAndSend(ALICE, { nonce }, ({ events = [], status }) => {
  //   console.log('Transaction status:', status.type)
  //
  //   if (status.isFinalized) {
  //     console.log('Completed at block hash', status.asFinalized.toHex())
  //     console.log('Alice registered the data she needs to be seeded')
  //     console.log('Events:')
  //
  //     events.forEach(({ phase, event: { data, method, section } }) => {
  //       console.log('\t', phase.toString(), `: ${section}.${method}`, data.toString())
  //     })
  //
  //     process.exit(0)
  //   }
  // })

  function getArchive () {
    let archive = []
    feed.ready(() => {
      archive.push(feed.key.toString('hex')) // ed25519::Public
      feed.rootHashes(0, (err, res) => {
        if (err) console.log(err)
        archive.push({
          hashType: 2, // u8
          children: [res[0].hash] //  Vec<ParentHashInRoot>
        })
      })
      feed.signature((err, res) => {
        if (err) console.log(err)
        archive.push(res.signature.toString('hex')) // ed25519::Signature
      })
    })
    return archive
  }


  // /*----------  QUERIES ------------ */
  //
  // query one
  // const UsersStorage = await api.query.datVerify.usersStorage(CHARLIE.publicKey)

  // query multiple
  // const [c, a] = await Promise.all([
  //   await api.query.datVerify.usersStorage(ALICE.publicKey),
  //   await api.query.datVerify.usersStorage(CHARLIE.publicKey),
  //   await api.query.datVerify.usersStorage(DAVE.publicKey),
  //   await api.query.datVerify.usersStorage(EVE.publicKey),
  //   await api.query.datVerify.usersStorage(ALICE.publicKey)
  // ])
  // console.log('charlie', c)
  // console.log('alice', a)

  // let EveBalance = await api.query.balances.freeBalance(EVE.publicKey)
  // console.log(`Eve has a balance: ${EveBalance}`)


}
