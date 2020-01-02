const { ApiPromise, WsProvider, Keyring, ApiRx } = require("@polkadot/api")
const provider = new WsProvider('ws://127.0.0.1:9944')
const fs = require('fs')
const types = JSON.parse(fs.readFileSync('./src/types.json').toString())
const hypercore = require('hypercore')
var feed = hypercore('./tmp', {valueEncoding: 'json'})

// feed.append({
//   hello: 'world'
// })
//
// feed.append({
//   hej: 'verden'
// })
//
// feed.append({
//   hola: 'mundo'
// })
//
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

  // /*----------  ACCOUNT ------------ */
  //
  // // default accounts in dev env (ALICE, CHARLIE, DAVE, FERDIE, EVE etc.)
  const keyring = new Keyring({ type: 'sr25519' })
  const ALICE = keyring.addFromUri('//Alice')
  const CHARLIE = keyring.addFromUri('//Charlie')
  const FERDIE = keyring.addFromUri('//Ferdie')
  const EVE = keyring.addFromUri('//Eve')
  const DAVE = keyring.addFromUri('//Dave')

  // Get the nonce for the admin key
  const nonce = await api.query.system.accountNonce(ALICE.address)

  // // create a new account
  // const { randomAsU8a } = require('@polkadot/util-crypto')
  // const NEW_ACCOUNT = keyring.addFromSeed(randomAsU8a(32))
  //console.log(NEW_ACCOUNT.address)
  //

  // transfer balance
  // const AMOUNT = 12345
  // const transfer = await api.tx.balances.transfer(FERDIE.address, AMOUNT)
  // const hash_transfer = await transfer.signAndSend(ALICE)
  // const hash_transfer = await transfer.signAndSend(ALICE, async (result) => {
  //   console.log(`Current status is ${result.status}`)
  //
  //   if (result.status.isFinalized) { // never gets here
  //     console.log(`Transaction included at blockHash ${result.status.asFinalized}`)
  //     let FerdieBalance = await api.query.balances.freeBalance(FERDIE.publicKey)
  //     console.log(`Ferdie has a balance: ${FerdieBalance}`)
  //   }
  // })
  //console.log('Transfer sent with hash', hash_transfer.toHex()) // for some reason it doesn't log


  /*----------  read chain state ------------ */

  // const [accountNonce, now, validators] = await Promise.all([
  //   api.query.system.accountNonce(ALICE.publicKey),
  //   api.query.timestamp.now(),
  //   api.query.session.validators()
  // ])
  //
  // console.log(`accountNonce(${ALICE.publicKey}) ${accountNonce}`)
  // console.log(`last block timestamp ${now.toNumber()}`)
  //
  // if (validators && validators.length > 0) {
  //   // Retrieve the balances for all validators
  //   const validatorBalances = await Promise.all(
  //     validators.map(authorityId =>
  //       api.query.balances.freeBalance(authorityId)
  //     )
  //   )
  //
  //   // Print out the authorityIds and balances of all validators
  //   console.log('validators', validators.map((authorityId, index) => ({
  //     address: authorityId.toString(),
  //     balance: validatorBalances[index].toString()
  //   })))
  // }

  /*----------  subscribe to system events via storage ------------ */

  // api.query.system.events((events) => {
  //   console.log(`\nReceived ${events.length} events:`)
  //
  //   // Loop through the Vec<EventRecord>
  //   events.forEach((record) => {
  //     // Extract the phase, event and the event types
  //     const { event, phase } = record
  //     const types = event.typeDef
  //
  //     // Show what we are busy with
  //     console.log(`\t${event.section}:${event.method}:: (phase=${phase.toString()})`)
  //     console.log(`\t\t${event.meta.documentation.toString()}`)
  //
  //     // Loop through each of the parameters, displaying the type and data
  //     event.data.forEach((data, index) => {
  //       console.log(`\t\t\t${types[index].type}: ${data.toString()}`)
  //     })
  //   })
  // })

  /*----------  transactions with events ------------ */

    //
    // const AMOUNT = 12345
    //
    // // Create a new random recipient
    // const { randomAsU8a } = require('@polkadot/util-crypto')
    // const recipient = keyring.addFromSeed(randomAsU8a(32)).address
    //
    // console.log('Sending', AMOUNT, 'from', ALICE.address, 'to', recipient, 'with nonce', nonce.toString())
    //
    // // Do the transfer and track the actual status
    // api.tx.balances
    //   .transfer(recipient, AMOUNT)
    //   .signAndSend(ALICE, { nonce }, ({ events = [], status }) => {
    //     console.log('Transaction status:', status.type)
    //
    //     if (status.isFinalized) {
    //       console.log('Completed at block hash', status.asFinalized.toHex())
    //       console.log('Events:')
    //
    //       events.forEach(({ phase, event: { data, method, section } }) => {
    //         console.log('\t', phase.toString(), `: ${section}.${method}`, data.toString())
    //       })
    //
    //       process.exit(0)
    //     }
    //   })

  /* ---------------------------------------

                EXTRINSICS

------------------------------------------- */


  // /*----------  TRANSACTIONS ------------ */
  //
  // // api.tx.datVerify - API to execute extrinsics
  // // api.query.datVerify - API to query
  //
  // .registerSeeder() - extrinsic to register as a seeder
   const registerSeeder = api.tx.datVerify.registerSeeder()
  // const hash_registerSeeder1 = await registerSeeder.signAndSend(ALICE)
  const hash_registerSeeder2 = await registerSeeder.signAndSend(CHARLIE)
  const hash_registerSeeder3 = await registerSeeder.signAndSend(FERDIE)
  // const hash_registerSeeder4 = await registerSeeder.signAndSend(DAVE, (res) => {
  //   console.log(res.events)
  // })
  const hash_registerSeeder5 = await registerSeeder.signAndSend(EVE)
  // console.log(hash_registerSeeder4)

  //const hash_registerSeeder4 = await registerSeeder.signAndSend(NEW_ACCOUNT)
  //
  // .registerData(archive) - extrinsic to publish hypercore you want to be seeded
  const registerData = api.tx.datVerify.registerData(getArchive())
  //const hashData1 = await registerData.signAndSend(DAVE)
  const hashData2 = await registerData.signAndSend(ALICE, { nonce }, ({ events = [], status }) => {
    console.log('Transaction status:', status.type)

    if (status.isFinalized) {
      console.log('Completed at block hash', status.asFinalized.toHex())
      console.log('Events:')

      events.forEach(({ phase, event: { data, method, section } }) => {
        console.log('\t', phase.toString(), `: ${section}.${method}`, data.toString())
      })

      process.exit(0)
    }
  })
  //console.log('hash 1', hashData1)
  console.log('hash 2', hashData2)
  //
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
  //   await api.query.datVerify.usersStorage(CHARLIE.publicKey),
  //   await api.query.datVerify.usersStorage(ALICE.publicKey)
  // ])
  // console.log('charlie', c)
  // console.log('alice', a)

  // let EveBalance = await api.query.balances.freeBalance(EVE.publicKey)
  // console.log(`Eve has a balance: ${EveBalance}`)

}
