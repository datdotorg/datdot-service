const { ApiPromise, WsProvider, Keyring, ApiRx } = require("@polkadot/api")
const provider = new WsProvider('ws://127.0.0.1:9944')
const fs = require('fs')
const types = JSON.parse(fs.readFileSync('./src/types.json').toString())
const hypercore = require('hypercore')
let archive = []
var feed = hypercore('./tmp', {valueEncoding: 'json'})

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
  archive.push(feed.key.toString('hex'))
  //archive[0] = ed25519::Public
  feed.rootHashes(0, (err, res) => {
    if (err) console.log(err)
    archive.push({
      hashType: 2,
      children: [res[0].hash]
    })
    // archive[2] = {
    //   hash_type: u8, //2
    //   children: Vec<ParentHashInRoot>
    // }
  })
  feed.signature((err, res) => {
    if (err) console.log(err)
    archive.push(res.signature.toString('hex'))
    //archive[1] = ed25519::Signature
  })
})

start(archive)
async function start (archive) {
  const api = await ApiPromise.create({
    provider,
    types
  })

  const keyring = new Keyring({ type: 'sr25519' });
  const ALICE = keyring.addFromUri('//Alice');
  console.log(archive)
  const datVerify = api.tx.datVerify
  .registerData(archive)
  //.registerSeeder()
  .signAndSend(ALICE, ({ events = [], status }) => {
      console.log(`Current status is ${status.type}`);

      if (status.isFinalized) {
        console.log(`Transaction included at blockHash ${status.asFinalized}`);

        events.forEach(({ phase, event: { data, method, section } }) => {
          console.log(`\t' ${phase}: ${section}.${method}:: ${data}`);
        });
      }
    });

}
