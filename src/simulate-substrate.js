const DB = require('./DB')
const handlers = []

module.exports = {
  create: () => ({
    query: {
      system: { events: handler => handlers.push(handler) },
      datVerify: { archive, users }
    },
    tx: { datVerify: { registerUser, registerEncoder, registerAttestor, registerHoster, registerData } }
  })
}
/******************************************************************************
  TRANSACTIONS (=EXTRINSICS)
******************************************************************************/
async function registerUser (...args) { return { signAndSend: signAndSend.bind({ args, type: 'registerUser' }) } }
async function registerEncoder (...args) { return { signAndSend: signAndSend.bind({ args, type: 'registerEncoder' }) } }
async function registerAttestor (...args) { return { signAndSend: signAndSend.bind({ args, type: 'registerAttestor' }) } }
async function registerHoster (...args) { return { signAndSend: signAndSend.bind({ args, type: 'registerHoster' }) } }
async function registerData (...args) { return { signAndSend: signAndSend.bind({ args, type: 'registerData'}) } }
async function registerHosting (...args) { return { signAndSend: signAndSend.bind({ args, type: 'registerHosting'}) } }
async function registerEncoding (...args) { return { signAndSend: signAndSend.bind({ args, type: 'registerEncoding'}) } }
/******************************************************************************
  QUERIES
******************************************************************************/
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
/******************************************************************************
  ROUTING (sign & send)
******************************************************************************/
function signAndSend (signer, { nonce }, status) {
  const { type, args } = this
  status({ events: [], status: { isInBlock:1 } })

  let user
  if (DB.user[signer]) user = DB.users[DB.user[signer]]
  else user = _registerUser(signer, { nonce }, status)
  if (!user) return console.error('NO USER', user)

  if (type === 'registerData') _registerData(user, { nonce }, status, args)
  else if (type === 'registerEncoder') _registerEncoder(user, { nonce }, status, args)
  else if (type === 'registerAttestor') _registerAttestor(user, { nonce }, status, args)
  else if (type === 'registerHoster') _registerHoster(user, { nonce }, status, args)
  else if (type === 'registerHosting') _registerHosting(user, { nonce }, status, args)
  else if (type === 'registerEncoding') _registerEncoding(user, { nonce }, status, args)
  // else if ...
}
/******************************************************************************
  API
******************************************************************************/
function _registerUser (user, { nonce }, status) {
  const pos = DB.users.push({ address: user })
  const id = pos - 1
  DB.user[user] = id
  console.log('New user created', DB.users[id])
  return DB.users[id]
}
async function _registerData (user, { nonce }, status, args) {
  const [ merkleRoot, plan ] = args
  console.log('REGISTER DATA USER', user)
  const [key, {hashType, children}, signature] = merkleRoot
  const feed = { publickey: key.toString('hex'), meta: { signature, hashType, children }, status: 'unhosted' }
  const id = DB.feeds.push(feed)
  DB.feed[key.toString('hex')] = id

  // @TODO Create also a new plan for the feed
  // const { publisher } = plan // {publisher: "", ranges: eef}
  // const publisherID = DB.user[plan.publisher]
  // console.log('PUBLISHGER ID', publisherID)
  // plan.publisher = DB.user[plan.publisher]
  // plan.feed = id
  // console.log('PLAAAN', plan)
  // DB.plans.push(plan)

  const SomethingStored = { event: { data: [user.address], method: 'SomethingStored' } }
  handlers.forEach(handler => handler([SomethingStored]))
}
async function _registerHoster(user, { nonce }, status) {
  const id = DB.user[user.address]
  console.log('Registering hoster', id, user.address)
  DB.hosters.push(id)
  const unhosted = DB.feeds.filter(feed => feed.status === 'unhosted')
  const randomFeed = getRandom(unhosted)
  const feedID = DB.feed[randomFeed.publickey]
  if (!feedID) return console.log('current lack of demand for hosting feeds')
  const encoderID = getRandom(DB.encoders)
  if (!encoderID) return console.log('missing encoder')
  // @TODO Create a contract based on a plan for this feed
  const NewPin = { event: { data: [encoderID, id, feedID], method: 'NewPin' } }
  handlers.forEach(handler => handler([NewPin]))
}
async function _registerEncoder (user, { nonce }, status) {
  const id = DB.user[user.address]
  DB.encoders.push(id)
}
async function _registerAttestor (user, { nonce }, status) {
  const id = DB.user[user.address]
  DB.attestors.push(id)

}
async function _registerHosting (signer, { nonce }, status, args) {
  // const [{ account, nonce, archive, index }] = args
}
async function _registerEncoding (signer, { nonce }, status, args) {
  // const [{account, nonce, hosterID, datID, start, range}] = args
}

/******************************************************************************
  HELPERS
******************************************************************************/
function getRandom (items) {
  if (!items.length) return
  return items[Math.floor(Math.random() * items.length)]
}
