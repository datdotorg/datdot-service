const DB = require('./DB')
const handlers = []

module.exports = {
  create: () => ({
    query: {
      system: { events: handler => handlers.push(handler) },
      datVerify: { archive, getUserByID }
    },
    tx: { datVerify: { newUser, registerEncoder, registerAttestor, registerHoster, publishFeedAndPlan } }
  })
}
/******************************************************************************
  TRANSACTIONS (=EXTRINSICS)
******************************************************************************/
async function newUser (...args) { return { signAndSend: signAndSend.bind({ args, type: 'newUser' }) } }
async function registerEncoder (...args) { return { signAndSend: signAndSend.bind({ args, type: 'registerEncoder' }) } }
async function registerAttestor (...args) { return { signAndSend: signAndSend.bind({ args, type: 'registerAttestor' }) } }
async function registerHoster (...args) { return { signAndSend: signAndSend.bind({ args, type: 'registerHoster' }) } }
async function publishFeedAndPlan (...args) { return { signAndSend: signAndSend.bind({ args, type: 'publishFeedAndPlan'}) } }
async function encodingDone (...args) { return { signAndSend: signAndSend.bind({ args, type: 'encodingDone'}) } }
async function hostingStarts (...args) { return { signAndSend: signAndSend.bind({ args, type: 'hostingStarts'}) } }
/******************************************************************************
  QUERIES
******************************************************************************/
function archive (id) {
  const pos = id - 1
  const feed = DB.feeds[pos]
  return { archive_pubkey: feed.publickey }
}
function getUserByID (id) {
  const pos = id - 1
  return DB.users[pos].address
}
/******************************************************************************
  ROUTING (sign & send)
******************************************************************************/
function signAndSend (signer, { nonce }, status) {
  const { type, args } = this
  status({ events: [], status: { isInBlock:1 } })

  const user = _newUser(signer, { nonce }, status)
  if (!user) return console.error('NO USER', user)

  if (type === 'publishFeedAndPlan') _publishFeedAndPlan(user, { nonce }, status, args)
  else if (type === 'registerEncoder') _registerEncoder(user, { nonce }, status, args)
  else if (type === 'registerAttestor') _registerAttestor(user, { nonce }, status, args)
  else if (type === 'registerHoster') _registerHoster(user, { nonce }, status, args)
  else if (type === 'hostingStarts') _hostingStarts(user, { nonce }, status, args)
  else if (type === 'encodingDone') _encodingDone(user, { nonce }, status, args)
  // else if ...
}
/******************************************************************************
  API
******************************************************************************/
function _newUser (signer, { nonce }, status) {
  let user
  if (DB.user[signer]) {
    const pos = DB.user[signer] - 1
    user = DB.users[pos]
  }
  else {
    const userID = DB.users.push({ address: signer })
    DB.user[signer] = userID
    const pos = userID - 1
    user = DB.users[pos]
  }
  return user
}
async function _publishFeedAndPlan (user, { nonce }, status, args) {
  // Publish feed
  const [ merkleRoot, plan ] = args
  const [key, {hashType, children}, signature] = merkleRoot
  const feed = { publickey: key.toString('hex'), meta: { signature, hashType, children } }
  const feedID = DB.feeds.push(feed)
  DB.feed[key.toString('hex')] = feedID

  const NewFeed = { event: { data: feedID, method: 'NewFeed' } }
  handlers.forEach(handler => handler([NewFeed]))

// Publish plan
  const userID = DB.user[user.address]
  plan.publisher = userID
  plan.feed = feedID
  plan.status = 'unhosted'
  const planID = DB.plans.push(plan)

  const NewPlan = { event: { data: planID, method: 'NewPlan' } }
  handlers.forEach(handler => handler([NewPlan]))
}
async function _registerHoster(user, { nonce }, status) {
  const userID = DB.user[user.address]
  DB.hosters.push(userID)
  makeNewContract({ encoderID: null, hosterID: userID})
}
async function _registerEncoder (user, { nonce }, status) {
  const userID = DB.user[user.address]
  DB.encoders.push(userID)
  makeNewContract({ encoderID: userID, hosterID: null})
}
async function _registerAttestor (user, { nonce }, status) {
  const userID = DB.user[user.address]
  DB.attestors.push(userID)
}
async function _hostingStarts (signer, { nonce }, status, args) {
  // const [{ account, nonce, archive, index }] = args
}
async function _encodingDone (signer, { nonce }, status, args) {
  // const [{account, nonce, hosterID, datID, start, range}] = args
}

/******************************************************************************
  HELPERS
******************************************************************************/
function getRandom (items) {
  if (!items.length) return
  return items[Math.floor(Math.random() * items.length)]
}

function makeNewContract (opts) {
  // Check if any unhosted plans
  let { encoderID, hosterID } = opts
  const unhosted = DB.plans.filter(plan => plan.status === 'unhosted')
  const selectedPlan = getRandom(unhosted)
  if (!selectedPlan) return console.log('current lack of demand for hosting plans')
  // Get missing pair (hoster or encoder)
  if (hosterID) encoderID = getRandom(DB.encoders)
  else if (encoderID) hosterID = getRandom(DB.hosters)
  if (!encoderID) return console.log('missing encoder')
  if (!hosterID) return console.log('missing hoster')
  // Make a new contract
  const feedID = selectedPlan.feed
  const NewContract = { event: { data: [encoderID, hosterID, feedID], method: 'NewContract' } }
  handlers.forEach(handler => handler([NewContract]))
  selectedPlan.status = 'encoding' // unhosted, pairing, encoded, hosted
}
