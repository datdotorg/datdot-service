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

  /*----------  ACCOUNT ------------ */

  // default accounts in dev env (ALICE, CHARLIE, DAVE, FERDIE, EVE etc.)
  const keyring = new Keyring({ type: 'sr25519' })
  const CHARLIE = keyring.addFromUri('//Charlie')

  // @TODO => create new custom account <= needs ballance in current model
  //  use library to generate mnemonic phrase
  // const PHRASE = 'entire material egg meadow latin bargain dutch coral blood melt acoustic thought'
  // const NEW_ACCOUNT = keyring.addFromUri(PHRASE)


  /*----------  EXTRINSICS ------------ */

// ALL extrinsics in dat_verify module
  const datVerify = api.tx.datVerify

  // .registerSeeder() - extrinsic to register as a seeder
  const registerSeeder = api.tx.datVerify.registerSeeder()
  const hash_registerSeeder = await registerSeeder.signAndSend(CHARLIE)
  console.log(hash_registerSeeder)

  // .registerData(archive) - extrinsic to publish hypercore you want to be seeded
  const registerData = api.tx.datVerify.registerData(getArchive())
  const hash_registerData = await registerData.signAndSend(CHARLIE)
  console.log(hash_registerData)

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


}
