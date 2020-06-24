const DB = require('./DB')
const handlers = []

module.exports = {
  create: () => ({
    query: {
      system: { events: handler => handlers.push(handler) },
      datVerify: { archive, users }
    },
    tx: { datVerify: { registerEncoder, registerAttestor, registerHoster, registerData } }
  })
}

async function registerEncoder () { return { signAndSend: signAndSend.bind('registerEncoder') } }
async function registerAttestor () { return { signAndSend: signAndSend.bind('registerAttestor') } }
async function registerHoster () { return { signAndSend: signAndSend.bind('registerHoster') } }
async function registerData (merkleRoot) {
  const [key, {hashType, children}, signature] = merkleRoot
  const feed = { publickey: key.toString('hex'), meta: { signature, hashType, children }, status: 'unhosted' }
  const id = DB.feeds.push(feed)
  DB.feed[key.toString('hex')] = id
  return { signAndSend: signAndSend.bind('registerData') }
}
async function registerHosting (opts) {
  const {account, nonce, archive, index} = opts
}
async function registerEncoding (opts) {
  const {account, nonce, hosterID, datID, start, range} = opts
}
function archive (id) {
  const pos = id - 1
  const feed = DB.feeds[pos]
  console.log('FEED from dat(id)', feed)
  return { archive_pubkey: feed.publickey }
}
function users (id) {
  console.log('Searching user, ID', id)
  console.log('USERs[id]', DB.users[id].address)
  return DB.users[id].address
}
async function signAndSend (signer, { nonce }, status) {
  const fn_name = `${this}`
  const USER = loadUser(signer)
  if (!USER) return console.error('NO USER', USER)
  status({ events: [], status: {isInBlock:1} })
  if (fn_name === 'registerData') {
    const SomethingStored = { event: { data: [USER.address], method: 'SomethingStored' } }
    handlers.forEach(handler => handler([SomethingStored]))
  }
  else if (fn_name === 'registerHoster') {
    const id = DB.user[USER.address]
    console.log('Registering hoster', id, USER.address)
    DB.hosters.push(id)
    const unhosted = DB.feeds.filter(feed => feed.status === 'unhosted')
    const randomFeed = getRandom(unhosted)
    const feedID = DB.feed[randomFeed.publickey]
    if (!feedID) return console.log('current lack of demand for hosting feeds')
    const encoderID = getRandom(DB.encoders)
    if (!encoderID) return console.log('missing encoder')
    const NewPin = { event: { data: [encoderID, id, feedID], method: 'NewPin' } }
    handlers.forEach(handler => handler([NewPin]))
  }
  else if (fn_name === 'registerEncoder') {
    const id = DB.user[USER.address]
    DB.encoders.push(id)
  }
  else if (fn_name === 'registerAttestor') {
    const id = DB.user[USER.address]
    DB.attestors.push(id)
  }
  else if (fn_name === 'registerHosting') {
  }
  else if (fn_name === 'registerEncoding') {
  }
}
// ---------------------------------------------------------------
// HELPER
// ---------------------------------------------------------------
function loadUser (signer) {
  if (DB.user[signer]) return DB.users[DB.user[signer]]
  const pos = DB.users.push({ address: signer })
  const id = pos - 1
  DB.user[signer] = id
  console.log('USERS', DB.users)
  return  DB.users[id]
}
function getRandom (items) {
  if (!items.length) return
  return items[Math.floor(Math.random() * items.length)]
}
