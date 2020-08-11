const DB = require('./DB')
const handlers = []

module.exports = {
  create: () => ({
    query: {
      system: { events: handler => handlers.push(handler) },
      datVerify: {
        getUserByID,
        getFeedByID,
        getPlanByID,
        getContractByID,
        getStorageChallengeByID,
        getPerformanceChallengeByID,
      }
    },
    createType: (nonce) => nonce,
    tx: { datVerify: {
      newUser,
      registerEncoder,
      registerAttestor,
      registerHoster,
      publishFeed,
      publishPlan,
      encodingDone,
      hostingStarts,
      requestStorageChallenge,
      requestPerformanceChallenge,
      submitStorageChallenge,
      submitPerformanceChallenge
      }
    }
  })
}
/******************************************************************************
  TRANSACTIONS (=EXTRINSICS)
******************************************************************************/
async function newUser (...args) { return { signAndSend: signAndSend.bind({ args, type: 'newUser' }) } }
async function registerEncoder (...args) { return { signAndSend: signAndSend.bind({ args, type: 'registerEncoder' }) } }
async function registerAttestor (...args) { return { signAndSend: signAndSend.bind({ args, type: 'registerAttestor' }) } }
async function registerHoster (...args) { return { signAndSend: signAndSend.bind({ args, type: 'registerHoster' }) } }
async function publishFeed (...args) { return { signAndSend: signAndSend.bind({ args, type: 'publishFeed'}) } }
async function publishPlan (...args) { return { signAndSend: signAndSend.bind({ args, type: 'publishPlan'}) } }
async function encodingDone (...args) { return { signAndSend: signAndSend.bind({ args, type: 'encodingDone'}) } }
async function hostingStarts (...args) { return { signAndSend: signAndSend.bind({ args, type: 'hostingStarts'}) } }
async function requestStorageChallenge (...args) { return { signAndSend: signAndSend.bind({ args, type: 'requestStorageChallenge'}) } }
async function requestPerformanceChallenge (...args) { return { signAndSend: signAndSend.bind({ args, type: 'requestPerformanceChallenge'}) } }
async function submitStorageChallenge (...args) { return { signAndSend: signAndSend.bind({ args, type: 'submitStorageChallenge'}) } }
async function submitPerformanceChallenge (...args) { return { signAndSend: signAndSend.bind({ args, type: 'submitPerformanceChallenge'}) } }
/******************************************************************************
  QUERIES
******************************************************************************/
function getFeedByID (id) { return DB.feeds[id - 1] }
function getUserByID (id) { return DB.users[id - 1] }
function getPlanByID (id) { return DB.plans[id - 1] }
function getContractByID (id) { return DB.contracts[id - 1] }
function getStorageChallengeByID (id) { return DB.storageChallenges[id - 1] }
function getPerformanceChallengeByID (id) { return DB.performanceChallenges[id - 1] }

/******************************************************************************
  ROUTING (sign & send)
******************************************************************************/
function signAndSend (signer, { nonce }, status) {
  const { type, args } = this
  status({ events: [], status: { isInBlock:1 } })

  const user = _newUser(signer.address, { nonce }, status)
  if (!user) return console.error('NO USER', user)

  if (type === 'publishFeed') _publishFeed(user, { nonce }, status, args)
  else if (type === 'publishPlan') _publishPlan(user, { nonce }, status, args)
  else if (type === 'registerEncoder') _registerEncoder(user, { nonce }, status, args)
  else if (type === 'registerAttestor') _registerAttestor(user, { nonce }, status, args)
  else if (type === 'registerHoster') _registerHoster(user, { nonce }, status, args)
  else if (type === 'encodingDone') _encodingDone(user, { nonce }, status, args)
  else if (type === 'hostingStarts') _hostingStarts(user, { nonce }, status, args)
  else if (type === 'requestStorageChallenge') _requestStorageChallenge(user, { nonce }, status, args)
  else if (type === 'requestPerformanceChallenge') _requestPerformanceChallenge(user, { nonce }, status, args)
  else if (type === 'submitStorageChallenge') _submitStorageChallenge(user, { nonce }, status, args)
  else if (type === 'submitPerformanceChallenge') _submitPerformanceChallenge(user, { nonce }, status, args)
  // else if ...
}
/******************************************************************************
  API
******************************************************************************/
function _newUser (address, { nonce }, status) {
  let user
  if (DB.userByAddress[address]) {
    const pos = DB.userByAddress[address] - 1
    user = DB.users[pos]
  }
  else {
    user = { address: address }
    const userID = DB.users.push(user)
    user.id = userID
    // push to userByAddress lookup array
    DB.userByAddress[address] = userID
  }
  return user
}
async function _publishFeed (user, { nonce }, status, args) {
  //@TODO check if feed already exists
  const [ merkleRoot ] = args
  const [key, {hashType, children}, signature] = merkleRoot
  const feed = { publickey: key.toString('hex'), meta: { signature, hashType, children } }
  const feedID = DB.feeds.push(feed)
  feed.id = feedID
  // push to feedByKey lookup array
  DB.feedByKey[key.toString('hex')] = feedID
  const userID = user.id
  feed.publisher = userID
  // Emit event
  const NewFeed = { event: { data: [feedID], method: 'FeedPublished' } }
  handlers.forEach(handler => handler([NewFeed]))
}
async function _publishPlan (user, { nonce }, status, args) {
  const [ plan ] = args
  const { feedID, ranges } =  plan
  const userID = user.id
  plan.supporter = userID // or patron?
  plan.feed = feedID
  plan.ranges = ranges
  const planID = DB.plans.push(plan)
  plan.id = planID
  // Add planID to unhostedPlans
  DB.unhostedPlans.push(planID)
  // Find hoster & encoder
  makeNewContract({planID})
  // Emit event
  const NewPlan = { event: { data: [planID], method: 'NewPlan' } }
  handlers.forEach(handler => handler([NewPlan]))
}
async function _registerHoster(user, { nonce }, status, args) {
  const [hosterKey] = args
  const userID = user.id
  DB.users[userID - 1].hosterKey = hosterKey.toString('hex')
  DB.users[userID - 1].hoster = true
  DB.idleHosters.push(userID)
  makeNewContract()
}
async function _registerEncoder (user, { nonce }, status, args) {
  const [encoderKey] = args
  const userID = user.id
  DB.users[userID - 1].encoderKey = encoderKey.toString('hex')
  DB.users[userID - 1].encoder = true
  DB.idleEncoders.push(userID)
  makeNewContract()
}
async function _registerAttestor (user, { nonce }, status, args) {
  const [attestorKey] = args
  const userID = user.id
  DB.users[userID - 1].attestorKey = attestorKey.toString('hex')
  DB.users[userID - 1].attestor = true
  DB.idleAttestors.push(userID)
  checkAttestorJobs()
  makeNewContract()
}
async function _encodingDone (user, { nonce }, status, args) {
  const [ contractID ] = args
  DB.contractsEncoded.push(contractID)
  const contract = DB.contracts[contractID - 1]
  const encoderIDs = contract.encoders
  encoderIDs.forEach(encoderID => { if (!DB.idleEncoders.includes(encoderID)) DB.idleEncoders.push(encoderID) })
}
async function _hostingStarts (user, { nonce }, status, args) {
  const [ contractID ] = args
  DB.contractsHosted.push(contractID)
  const contract = DB.contracts[contractID - 1]
  // attestor finished job, add them to idleAttestors again
  const attestorID = contract.attestor
  if (!DB.idleAttestors.includes(attestorID)) {
    DB.idleAttestors.push(attestorID)
    checkAttestorJobs()
  }
  const userID = user.id
  const confirmation = { event: { data: [contractID, userID], method: 'HostingStarted' } }
  handlers.forEach(handler => handler([confirmation]))
}
async function _requestStorageChallenge (user, { nonce }, status, args) {
  const [ contractID, hosterID ] = args
  const ranges = DB.contracts[contractID - 1].ranges // [ [0, 3], [5, 7] ]
  // @TODO currently we check one chunk in each range => find better logic
  const chunks = ranges.map(range => getRandomInt(range[0], range[1] + 1))
  const storageChallenge = { contract: contractID, hoster: hosterID, chunks }
  const storageChallengeID = DB.storageChallenges.push(storageChallenge)
  storageChallenge.id = storageChallengeID
  const attestorID = DB.idleAttestors.shift()
  storageChallenge.attestor = attestorID
  // emit events
  const challenge = { event: { data: [storageChallengeID], method: 'NewStorageChallenge' } }
  handlers.forEach(handler => handler([challenge]))
}
async function _submitStorageChallenge (user, { nonce }, status, args) {
  const [ storageChallengeID, proof ] = args
  const storageChallenge = DB.storageChallenges[storageChallengeID - 1]
  // attestor finished job, add them to idleAttestors again
  const attestorID = storageChallenge.attestor
  if (!DB.idleAttestors.includes(attestorID)) {
    DB.idleAttestors.push(attestorID)
    checkAttestorJobs()
  }
  // @TODO validate proof
  const isValid = validateProof(proof, storageChallenge)
  let proofValidation
  const data = [storageChallengeID]
  console.log('StorageChallenge Proof for challenge:', storageChallengeID)
  if (isValid) response = { event: { data, method: 'StorageChallengeConfirmed' } }
  else response = { event: { data: [storageChallengeID], method: 'StorageChallengeFailed' } }
  // emit events
  handlers.forEach(handler => handler([response]))
}
async function _requestPerformanceChallenge (user, { nonce }, status, args) {
  const [ contractID ] = args
  const performanceChallenge = { contract: contractID }
  const performanceChallengeID = DB.performanceChallenges.push(performanceChallenge)
  performanceChallenge.id = performanceChallengeID
  if (DB.idleAttestors.length >= 5) emitPerformanceChallenge(performanceChallenge)
  else DB.attestorJobs.push({ fnName: 'emitPerformanceChallenge', opts: performanceChallenge })
}

async function _submitPerformanceChallenge (user, { nonce }, status, args) {
  const [ performanceChallengeID, report ] = args
  console.log(`Performance Challenge proof by attestor: ${user.id} for challenge: ${performanceChallengeID}`)
  const performanceChallenge = DB.performanceChallenges[performanceChallengeID - 1]
  // attestor finished job, add them to idleAttestors again
  const attestorID = user.id
  if (!DB.idleAttestors.includes(attestorID)) {
    DB.idleAttestors.push(attestorID)
    checkAttestorJobs()
  }
  // emit events
  if (report) response = { event: { data: [performanceChallengeID], method: 'performanceChallengeConfirmed' } }
  else response = { event: { data: [performanceChallengeID], method: 'performanceChallengeFailed' } }
  handlers.forEach(handler => handler([response]))
}

/******************************************************************************
  HELPERS
******************************************************************************/
function getRandom (items) {
  if (!items.length) return
  const pos = Math.floor(Math.random() * items.length)
  const item = items[pos]
  return [item, pos]
}
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}
function validateProof (proof, storageChallenge) {
  const chunks = storageChallenge.chunks
  if (`${chunks.length}` === `${proof.length}`) return true
  else return false
}
////////////////////////////////////////////////////////////////////////////
function makeNewContract (planID) {
  // Find an unhosted plan
  const unhosted = DB.unhostedPlans
  if (!planID && unhosted.length) [planID, pos] = getRandom(unhosted)
  const selectedPlan = DB.plans[planID - 1]
  if (!selectedPlan) return console.log('current lack of demand for hosting plans')
  // Get hosters, encoders and attestors
  const encoders  = DB.idleEncoders
  const hosters   = DB.idleHosters
  const attestors = DB.idleAttestors
  if (encoders.length <= 3) return console.log(`missing encoders`)
  if (hosters.length <= 3) return console.log(`missing hosters`)
  if (!attestors.length) return console.log(`missing attestors`)

  // Make a new contract
  const contract = {
    plan: planID,
    ranges: selectedPlan.ranges,
    encoders: encoders.splice(0,3),
    hosters: hosters.splice(0,3),
    attestor: attestors.shift()
  }
  unhosted.forEach((id, i) => { if (id === planID) unhosted.splice(i, 1) })
  // [idleEncoders, idleHosters, idleAttestors] = [ [], [], [] ]
  console.log('New contract', contract)
  const contractID = DB.contracts.push(contract)
  contract.id = contractID
  // remove planID from unhostedPlans
  // when all contracts for certain plan are hosted => push planID to hostedPlans
  DB.unhostedPlans.splice(planID, 1)
  const NewContract = { event: { data: [contractID], method: 'NewContract' } }
  handlers.forEach(handler => handler([NewContract]))
}
////////////////////////////////////////////////////////////////////////////
function checkAttestorJobs () {
  if (DB.attestorJobs.length) {
    const next = DB.attestorJobs[0]
    if (next.fnName === 'emitPerformanceChallenge' && DB.idleAttestors.length >= 5) {
      DB.attestorJobs.shift()
      emitPerformanceChallenge(next.opts)
    }
  }
}
////////////////////////////////////////////////////////////////////////////
function emitPerformanceChallenge (performanceChallenge) {
  performanceChallenge.attestors = DB.idleAttestors.splice(0, 5)
  const performanceChallengeID = performanceChallenge.id
  const challenge = { event: { data: [performanceChallengeID], method: 'NewPerformanceChallenge' } }
  handlers.forEach(handler => handler([challenge]))
}
