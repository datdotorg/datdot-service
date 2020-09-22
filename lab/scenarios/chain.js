const DB = require('../../src/DB')
const logkeeper = require('./logkeeper')
const WebSocket = require('ws')


const connections = {}
const handlers = []

init()

async function init () {
  const [json, logport] = process.argv.slice(2)
  const config = JSON.parse(json)
  const [host, PORT] = config.chain

  const name = `chain`
  const log = await logkeeper(name, logport)

  const wss = new WebSocket.Server({ port: PORT }, after)

  function after () {
    log({ type: 'chain', body: [`running on http://localhost:${wss.address().port}`] })
  }

  wss.on('connection', function connection (ws) {
    ws.on('message', async function incoming (message) {
      const { flow, type, body } = JSON.parse(message)
      const [from, id] = flow
      if (id === 0) {
        if (!connections[from]) {
          connections[from] = { name: from, counter: id, ws, log: log.sub(from) }
          handlers.push([from, body => ws.send(JSON.stringify({ body }))])
        }
        else return ws.send(JSON.stringify({
          cite: [flow], type: 'error', body: 'name is already taken'
        }))
      }
      const _log = connections[from].log
      _log({ type: 'chain', body: [`${type} ${flow}`] })
      const method = queries[type] || signAndSend
      if (!method) return ws.send({ cite: [flow], type: 'error', body: 'unknown type' })
      const result = await method(body, from, body => {
        // _log({ type: 'chain', body: [`send data after "${type}" to: ${from}`] })
        ws.send(JSON.stringify({ cite: [flow], type: 'data', body }))
      })
      if (!result) return
      const msg = { cite: [flow], type: 'done', body: result }
      // _log({ type: 'chain', body: [`sending "${type}" to: ${from}`] })
      ws.send(JSON.stringify(msg))
    })
  })
}
/******************************************************************************
  QUERIES
******************************************************************************/
const queries = {
  getFeedByID,
  getFeedByKey,
  getUserByID,
  getPlanByID,
  getContractByID,
  getStorageChallengeByID,
  getPerformanceChallengeByID,
}

function getFeedByID (id) { return DB.feeds[id - 1] }
function getFeedByKey (key) { return DB.feedByKey[key.toString('hex')] }
function getUserByID (id) { return DB.users[id - 1] }
function getPlanByID (id) { return DB.plans[id - 1] }
function getContractByID (id) { return DB.contracts[id - 1] }
function getStorageChallengeByID (id) { return DB.storageChallenges[id - 1] }
function getPerformanceChallengeByID (id) { return DB.performanceChallenges[id - 1] }
/******************************************************************************
  ROUTING (sign & send)
******************************************************************************/
function signAndSend (body, name, status) {
  const log = connections[name].log
  const { type, args, nonce, address } = body
  status({ events: [], status: { isInBlock:1 } })

  const user = _loadUser(address, { name, nonce }, status)
  if (!user) return log({ type: 'chain', body: [`UNKNOWN SENDER of: ${body}`] }) // @TODO: maybe use status() ??
  if (type === 'publishFeed') _publishFeed(user, { name, nonce }, status, args)
  else if (type === 'publishPlan') _publishPlan(user, { name, nonce }, status, args)
  else if (type === 'registerEncoder') _registerEncoder(user, { name, nonce }, status, args)
  else if (type === 'registerAttestor') _registerAttestor(user, { name, nonce }, status, args)
  else if (type === 'registerHoster') _registerHoster(user, { name, nonce }, status, args)
  else if (type === 'encodingDone') _encodingDone(user, { name, nonce }, status, args)
  else if (type === 'hostingStarts') _hostingStarts(user, { name, nonce }, status, args)
  else if (type === 'requestStorageChallenge') _requestStorageChallenge(user, { name, nonce }, status, args)
  else if (type === 'requestPerformanceChallenge') _requestPerformanceChallenge(user, { name, nonce }, status, args)
  else if (type === 'submitStorageChallenge') _submitStorageChallenge(user, { name, nonce }, status, args)
  else if (type === 'submitPerformanceChallenge') _submitPerformanceChallenge(user, { name, nonce }, status, args)
  // else if ...
}
/******************************************************************************
  API
******************************************************************************/
function _loadUser (address, { name, nonce }, status) {

  const log = connections[name].log
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
    log({ type: 'chain', body: [`New user: ${name}, ${user.id}, ${address}`] })
  }
  return user
}
async function _publishFeed (user, { name, nonce }, status, args) {
  const log = connections[name].log

  const [merkleRoot]  = args
  const [key, {hashType, children}, signature] = merkleRoot
  const keyBuf = Buffer.from(key, 'hex')
  // check if feed already exists
  if (DB.feedByKey[keyBuf.toString('hex')]) return
  const feed = { publickey: keyBuf.toString('hex'), meta: { signature, hashType, children } }
  const feedID = DB.feeds.push(feed)
  feed.id = feedID
  // push to feedByKey lookup array
  DB.feedByKey[keyBuf.toString('hex')] = feedID
  const userID = user.id
  feed.publisher = userID
  // Emit event
  const NewFeed = { event: { data: [feedID], method: 'FeedPublished' } }
  const event = [NewFeed]
  handlers.forEach(([name, handler]) => handler(event))
  // log({ type: 'chain', body: [`emit chain event ${JSON.stringify(event)}`] })
}
async function _publishPlan (user, { name, nonce }, status, args) {
  const log = connections[name].log

  const [plan] = args
  const { feeds, from, until, importance, config, schedules } =  plan
  const userID = user.id
  plan.sponsor = userID // or patron?
  const planID = DB.plans.push(plan)
  plan.id = planID
  // Add planID to unhostedPlans
  DB.unhostedPlans.push(planID)
  // Add feeds to unhosted
  plan.unhostedFeeds = feeds
  // Find hosters,encoders and attestors
  tryNewContract({ plan, log })
  // Emit event
  const NewPlan = { event: { data: [planID], method: 'NewPlan' } }
  const event = [NewPlan]
  handlers.forEach(([name, handler]) => handler(event))
  // log({ type: 'chain', body: [`emit chain event ${JSON.stringify(event)}`] })
}
async function _registerHoster(user, { name, nonce }, status, args) {
  const log = connections[name].log

  const userID = user.id
  const [hosterKey, form] = args
  // @TODO emit event or make a callback to notify the user
  if (DB.users[userID-1].hosterKey) return log({ type: 'chain', body: [`User is already registered as a hoster`] })
  const keyBuf = Buffer.from(hosterKey, 'hex')
  DB.users[userID - 1].hosterKey = keyBuf.toString('hex')
  DB.users[userID - 1].hosterForm = form
  DB.idleHosters.push(userID)
  tryNewContract({ log })
}
async function _registerEncoder (user, { name, nonce }, status, args) {
  const log = connections[name].log

  const userID = user.id
  const [encoderKey, form] = args
  if (DB.users[userID-1].encoderKey) return log({ type: 'chain', body: [`User is already registered as encoder`] })
  const keyBuf = Buffer.from(encoderKey, 'hex')
  DB.users[userID - 1].encoderKey = keyBuf.toString('hex')
  DB.users[userID - 1].encoderForm = form
  DB.idleEncoders.push(userID)
  tryNewContract({ log })
}
async function _registerAttestor (user, { name, nonce }, status, args) {
  const log = connections[name].log

  const userID = user.id
  const [attestorKey, form] = args
  if (DB.users[userID-1].attestorKey) return log({ type: 'chain', body: [`User is already registered as a attestor`] })
  const keyBuf = Buffer.from(attestorKey, 'hex')
  DB.users[userID - 1].attestorKey = keyBuf.toString('hex')
  DB.users[userID - 1].attestorForm = form
  DB.idleAttestors.push(userID)
  checkAttestorJobs(log)
  tryNewContract({ log })
}
async function _encodingDone (user, { name, nonce }, status, args) {
  const log = connections[name].log

  const [ contractID ] = args
  DB.contractsEncoded.push(contractID)
  const contract = DB.contracts[contractID - 1]
  const encoderIDs = contract.encoders
  encoderIDs.forEach(encoderID => { if (!DB.idleEncoders.includes(encoderID)) DB.idleEncoders.push(encoderID) })
  // @TODO check if any jobs waiting for the encoders
}
async function _hostingStarts (user, { name, nonce }, status, args) {
  const log = connections[name].log

  // @TODO check if encodingDone and only then trigger hostingStarts
  const [ contractID ] = args
  DB.contractsHosted.push(contractID)
  const contract = DB.contracts[contractID - 1]
  // if hosting starts, also the attestor finished job, add them to idleAttestors again
  const attestorID = contract.attestor
  if (!DB.idleAttestors.includes(attestorID)) {
    DB.idleAttestors.push(attestorID)
    checkAttestorJobs(log)
  }
  const userID = user.id
  const confirmation = { event: { data: [contractID, userID], method: 'HostingStarted' } }
  const event = [confirmation]
  handlers.forEach(([name, handler]) => handler(event))
  // log({ type: 'chain', body: [`emit chain event ${JSON.stringify(event)}`] })
}
async function _requestStorageChallenge (user, { name, nonce }, status, args) {
  const log = connections[name].log

  const [ contractID, hosterID ] = args
  const ranges = DB.contracts[contractID - 1].ranges // [ [0, 3], [5, 7] ]
  // @TODO currently we check one chunk in each range => find better logic
  const chunks = ranges.map(range => getRandomInt(range[0], range[1] + 1))
  const storageChallenge = { contract: contractID, hoster: hosterID, chunks }
  const storageChallengeID = DB.storageChallenges.push(storageChallenge)
  storageChallenge.id = storageChallengeID
  const attestorID = getAttestor(storageChallenge, log)
  if (!attestorID) return
  storageChallenge.attestor = attestorID
  // emit events
  const challenge = { event: { data: [storageChallengeID], method: 'NewStorageChallenge' } }
  const event = [challenge]
  handlers.forEach(([name, handler]) => handler(event))
  // log({ type: 'chain', body: [`emit chain event ${JSON.stringify(event)}`] })
}
async function _submitStorageChallenge (user, { name, nonce }, status, args) {
  const log = connections[name].log

  const [ storageChallengeID, proofs ] = args
  const storageChallenge = DB.storageChallenges[storageChallengeID - 1]
  // attestor finished job, add them to idleAttestors again
  const attestorID = storageChallenge.attestor
  if (!DB.idleAttestors.includes(attestorID)) {
    DB.idleAttestors.push(attestorID)
    checkAttestorJobs(log)
  }
  // @TODO validate proof
  const isValid = validateProof(proofs, storageChallenge)
  let proofValidation
  const data = [storageChallengeID]
  log({ type: 'chain', body: [`StorageChallenge Proof for challenge: ${storageChallengeID}`] })
  if (isValid) response = { event: { data, method: 'StorageChallengeConfirmed' } }
  else response = { event: { data: [storageChallengeID], method: 'StorageChallengeFailed' } }
  // emit events
  const event = [response]
  handlers.forEach(([name, handler]) => handler(event))
  // log({ type: 'chain', body: [`emit chain event ${JSON.stringify(event)}`] })
}
async function _requestPerformanceChallenge (user, { name, nonce }, status, args) {
  const log = connections[name].log

  const [ contractID ] = args
  const performanceChallenge = { contract: contractID }
  const performanceChallengeID = DB.performanceChallenges.push(performanceChallenge)
  performanceChallenge.id = performanceChallengeID
  if (DB.idleAttestors.length >= 5) emitPerformanceChallenge(performanceChallenge, log)
  else DB.attestorJobs.push({ fnName: 'emitPerformanceChallenge', opts: performanceChallenge })
}

async function _submitPerformanceChallenge (user, { name, nonce }, status, args) {
  const log = connections[name].log

  const [ performanceChallengeID, report ] = args
  log({ type: 'chain', body: [`Performance Challenge proof by attestor: ${user.id} for challenge: ${performanceChallengeID}`] })
  const performanceChallenge = DB.performanceChallenges[performanceChallengeID - 1]
  // attestor finished job, add them to idleAttestors again
  const attestorID = user.id
  if (!DB.idleAttestors.includes(attestorID)) {
    DB.idleAttestors.push(attestorID)
    checkAttestorJobs(log)
  }
  // emit events
  if (report) response = { event: { data: [performanceChallengeID], method: 'PerformanceChallengeConfirmed' } }
  else response = { event: { data: [performanceChallengeID], method: 'PerformanceChallengeFailed' } }
  const event = [response]
  handlers.forEach(([name, handler]) => handler(event))
  // log({ type: 'chain', body: [`emit chain event ${JSON.stringify(event)}`] })
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
function validateProof (proofs, storageChallenge) {
  const chunks = storageChallenge.chunks
  if (`${chunks.length}` === `${proofs.length}`) return true
  else return false
}
////////////////////////////////////////////////////////////////////////////
function tryNewContract ({ plan, log }) {
  let planID
  if (plan) planID = plan.id
  // Find an unhosted plan
  const unhostedPlans = DB.unhostedPlans

  if (!planID && unhostedPlans.length) [planID, pos] = getRandom(unhostedPlans)
  const selectedPlan = DB.plans[planID - 1]
  if (!selectedPlan) return log({ type: 'chain', body: [`current lack of demand for hosting plans`] })

  // Get available hosters, encoders and attestors
  const { unhostedFeeds, from, until, importance, config, schedules } =  selectedPlan
  const encoders  = DB.idleEncoders
  const hosters  = DB.idleHosters
  const attestors = DB.idleAttestors
  if (encoders.length < 3) return log({ type: 'chain', body: [`missing encoders`] })
  if (hosters.length < 3) return log({ type: 'chain', body: [`missing hosters`] })
  if (!attestors.length) return log({ type: 'chain', body: [`missing attestors`] })

  // @TODO select hosters and encoders who match the plan (storage space, availability etc.)
  // see user.attestorForm/encoderForm/hosterForm to see their settings
  // get info about space needed from hoster (calculate chunks amount x 164kb?)
  // Select the providers for a new contract
  const selectedEncoders = selectEncoders(encoders)
  const selectedHosters = selectHosters(hosters, selectedEncoders)
  if (!selectedHosters) {
    encoders.unshift(selectedEncoders)
    return log({ type: 'chain', body: [`missing unique hosters`] })
  }
  const selectedAttestor = selectAttestor(attestors, selectedEncoders, selectedHosters)
  if (!selectedAttestor) {
    encoders.unshift(selectedEncoders)
    hosters.unshift(selectedHosters)
    return log({ type: 'chain', body: [`missing unique attestors`] })
  }
  const opts = { planID, selectedEncoders, selectedHosters, selectedAttestor, unhostedPlans, unhostedFeeds }
  makeContract (opts, log)
}

function makeContract (opts, log) {
  const { planID, selectedEncoders, selectedHosters, selectedAttestor, unhostedPlans, unhostedFeeds } = opts
  const feed = unhostedFeeds.shift()
  // If no unhosted feeds left, remove selected plan ID from unhostedPlans
  if (!unhostedFeeds.length) removeFromUnhosted(planID, unhostedPlans)
  // Make a new contract
  // @TODO check that same user isn't taking more than 1 role in the contract
  const contract = {
    plan: planID,
    feed: feed.id,
    // @TODO add until
    // @TODO add ranges for this particular contract
    ranges: feed.ranges,
    encoders: selectedEncoders,
    hosters: selectedHosters,
    attestor: selectedAttestor
  }
  log({ type: 'chain', body: [`New Contract: ${JSON.stringify(contract)}`] })

  const contractID = DB.contracts.push(contract)
  contract.id = contractID
  const NewContract = { event: { data: [contractID], method: 'NewContract' } }
  const event = [NewContract]
  handlers.forEach(([name, handler]) => handler(event))
  // log({ type: 'chain', body: [`emit chain event ${JSON.stringify(event)}`] })
}

////////////////////////////////////////////////////////////////////////////
function checkAttestorJobs (log) {
  if (DB.attestorJobs.length) {
    const next = DB.attestorJobs[0]
    if (next.fnName === 'emitPerformanceChallenge' && DB.idleAttestors.length >= 5) {
      DB.attestorJobs.shift()
      emitPerformanceChallenge(next.opts, log)
    }
    if (next.fnName === 'emitStorageChallenge' && DB.idleAttestors.length >= 1) {
      DB.attestorJobs.shift()
      emitStorageChallenge(next.opts, log)
    }
  }
}

////////////////////////////////////////////////////////////////////////////
function removeFromUnhosted (planID, unhostedPlans) {
  for (var i = 0; i < unhostedPlans.length; i++) {
    if (unhostedPlans[i] === planID) unhostedPlans.splice(i, 1)
  }
}

function selectEncoders (encoders) {
  // @TODO check for each encoder if (encoder.form.until is undefined or date is tomorrow)
  return encoders.splice(0,3)
}
function selectHosters (hosters, selectedEncoders) {
  // @TODO check for each hoster if enough storage, if available in requested schedules of the contract
  var selected = []
  var indexes = []
  for (var i = 0; i < hosters.length; i++) {
    if (!selectedEncoders.includes(hosters[i]))  {
      selected.push(hosters[i])
      indexes.push(i)
      if (selected.length === 3) {
        indexes.forEach(i => hosters.splice(i, 1))
        break
      }
    }
  }
  return selected
}
function selectAttestor (attestors, selectedEncoders, selectedHosters) {
  // @TODO check for each attestor if (attestor.form.until is undefined or date is tomorrow)
  var selected
  for (var i = 0; i < attestors.length; i++) {
    if (!selectedEncoders.includes(attestors[i]) && !selectedHosters.includes(attestors[i])) {
      selected = attestors[i]
      attestors.splice(i, 1)
      break
    }
  }
  return selected
}
function getAttestor (storageChallenge, log) {
  const hosterID = storageChallenge.hoster
  log({ type: 'chain', body: [`getting attestor ${ DB.idleAttestors}`] })
  for (var i = 0; i < DB.idleAttestors.length; i++) {
    if (DB.idleAttestors[i]!== hosterID) return DB.idleAttestors.splice(i, 1)
  }
  DB.attestorJobs.push({ fnName: 'emitStorageChallenge', opts: storageChallenge })
}
////////////////////////////////////////////////////////////////////////////
function emitPerformanceChallenge (performanceChallenge, log) {
  // select 5 attestors
  performanceChallenge.attestors = DB.idleAttestors.splice(0, 5)
  const performanceChallengeID = performanceChallenge.id
  const challenge = { event: { data: [performanceChallengeID], method: 'NewPerformanceChallenge' } }
  const event = [challenge]
  handlers.forEach(([name, handler]) => handler(event))
  log({ type: 'chain', body: [`emit chain event ${JSON.stringify(event)}`] })
}
function emitStorageChallenge (storageChallenge, log) {
  const attestorID = getAttestor(storageChallenge, log)
  // @TODO if no attestor, we then add the job back to attestorJobs, but at the end of the array(!)
  if (!attestorID) return
  storageChallenge.attestor = attestorID
  // emit events
  const challenge = { event: { data: [storageChallenge.id], method: 'NewStorageChallenge' } }
  const event = [challenge]
  handlers.forEach(([name, handler]) => handler(event))
  log({ type: 'chain', body: [`emit chain event ${JSON.stringify(event)}`] })
}
