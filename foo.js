const hypercore = require('hypercore')
var feed = hypercore('./tmp', {valueEncoding: 'json'})
let archiveArr = []

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
  console.log('Add archiveArr key')
  getRootHash(archiveArr)
}
function getRootHash (archiveArr) {
  const index = feed.length - 1
  feed.rootHashes(index, (err, res) => {
    if (err) console.log(err)
    archiveArr.push({
      hashType: 2, // u8
      children: JSON.stringify(res) //  Vec<ParentHashInRoot>
    })
    console.log('Add rootHash')
    getSignature(archiveArr)
  })
}
function getSignature (archiveArr) {
  feed.signature((err, res) => {
    if (err) console.log(err)
    archiveArr.push(res.signature.toString('hex')) // ed25519::Signature
    console.log('Add signature')
    console.log('Archive array: ', archiveArr)
    start(api, archiveArr)
  })
}
