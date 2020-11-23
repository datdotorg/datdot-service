const DB = require('../../src/DB')
const makeSets = require('../../src/makeSets')
const blockgenerator = require('../../src/scheduleAction')
const logkeeper = require('./logkeeper')
const WebSocket = require('ws')

const connections = {}
const handlers = []
const scheduler = init()
var header = 0

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
      _log({ type: 'chain', body: [`${JSON.stringify(type)} ${JSON.stringify(flow)}`] })
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
  return blockgenerator(log.sub('blockgenerator'), blockMessage => {
    header = blockMessage.body
    Object.entries(connections).forEach(([name, channel]) => {
      channel.ws.send(JSON.stringify(blockMessage))
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
  getUserIDByKey,
  getPlanByID,
  getAmendmentByID,
  getContractByID,
  getStorageChallengeByID,
  getPerformanceChallengeByID,
}

function getFeedByID (id) { return DB.feeds[id - 1] }
function getFeedByKey (key) {
  const keyBuf = Buffer.from(key, 'hex')
  return DB.feedByKey[keyBuf.toString('hex')]
}
function getUserByID (id) { return DB.users[id - 1] }
function getUserIDByKey(key) {
  const keyBuf = Buffer.from(key, 'hex')
  return DB.userIDByKey[keyBuf.toString('hex')]
}
function getPlanByID (id) { return DB.plans[id - 1] }
function getContractByID (id) { return DB.contracts[id - 1] }
function getAmendmentByID (id) { return DB.amendments[id - 1] }
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
  else if (type === 'amendmentReport') _amendmentReport(user, { name, nonce }, status, args)
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
    const id = DB.users.push(user)
    user.id = id
    DB.userByAddress[address] = user.id // push to userByAddress lookup array
    log({ type: 'chain', body: [`New user: ${name}, ${user.id}, ${address}`] })
  }
  return user
}
/*----------------------
      PUBLISH FEED
------------------------*/
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
  DB.feedByKey[keyBuf.toString('hex')] = feedID
  feed.publisher = user.id
  // Emit event
  const NewFeed = { event: { data: [feedID], method: 'FeedPublished' } }
  const event = [NewFeed]
  handlers.forEach(([name, handler]) => handler(event))
  // log({ type: 'chain', body: [`emit chain event ${JSON.stringify(event)}`] })
}
/*----------------------
      (UN)PUBLISH PLAN
------------------------*/
async function _publishPlan (user, { name, nonce }, status, args) {
  const log = connections[name].log
  log({ type: 'chain', body: [`Publishing a plan`] })
  const [plan] = args
  if (!planValid({ plan })) return log({ type: 'chain', body: [`Plan from and/or until are invalid`] })
  plan.sponsor = user.id
  plan.contracts = []
  const planID = DB.plans.push(plan) // store the plan
  const id = planID
  plan.id = id
  makeContractsAndScheduleAmendments({ plan }, log) // schedule the plan execution
  // Emit event
  const NewPlan = { event: { data: [planID], method: 'NewPlan' } }
  const event = [NewPlan]
  handlers.forEach(([name, handler]) => handler(event))
  // log({ type: 'chain', body: [`emit chain event ${JSON.stringify(event)}`] })
}
async function unpublishPlan (user, { name, nonce }, status, args) {
  const [planID] = args
  const plan = getPlanByID(planID)
  if (!plan.sponsor === user.id) return log({ type: 'chain', body: [`Only a sponsor is allowed to unpublish the plan`] })
  cancelContracts(plan) // remove all hosted and draft contracts
}
/*----------------------
  (UN)REGISTER HOSTER
------------------------*/
async function _registerHoster(user, { name, nonce }, status, args) {
  const log = connections[name].log
  const [hosterKey, form] = args
  const userID = user.id
  if (!user.hoster) user.hoster = {}
  if (user.hoster[hosterKey]) return log({ type: 'chain', body: [`User is already registered as a hoster`] })
  const keyBuf = Buffer.from(hosterKey, 'hex')
  DB.userIDByKey[keyBuf.toString('hex')] = user.id // push to userByRoleKey lookup array
  user.hoster = {
    key: keyBuf.toString('hex'),
    form,
    jobs: {},
    idleStorage: form.storage,
    capacity: form.capacity,
  }
  DB.idleHosters.push(userID)
  tryNextAmendments(log) // see if enough providers for new contract
  // Emit event
  const confirmation = { event: { data: [userID], method: 'RegisteredForHosting' } }
  const event = [confirmation]
  handlers.forEach(([name, handler]) => handler(event))
  // log({ type: 'chain', body: [`emit chain event ${JSON.stringify(event)}`] })
}
async function unregisterHoster (user, { name, nonce }, status) {
  const { id, hoster: { jobs: hosterJobs, key, form } } = user
  unregisterRole ({ user, role: 'hoster', idleProviders: DB.idleHosters })
  const jobs = Object.keys(hosterJobs)
  jobs.map(job => {
    const contractID = job.split('NewAmendment')[1]
    if (contractID) {
      const feedID = getContractByID(contractID).feed
      const contract = getContractByID(contractID)
      for (var i = 0, len = contract.activeHosters.length; i < len; i++) {
        const { hosterID, amendmentID } = contract.activeHosters[i]
        if (hosterID !== user.id) continue
        contract.activeHosters.splice(i, 1)
        emitDropHosting({ amendmentID, hosterID: id}, log)
      }
    }
  })
}
/*----------------------
  (UN)REGISTER ENCODER
------------------------*/
async function _registerEncoder (user, { name, nonce }, status, args) {
  const log = connections[name].log
  const userID = user.id
  const [encoderKey, form] = args
  if (!user.encoder) user.encoder = {}
  if (user.encoder[encoderKey]) return log({ type: 'chain', body: [`User is already registered as encoder`] })
  const keyBuf = Buffer.from(encoderKey, 'hex')
  DB.userIDByKey[keyBuf.toString('hex')] = user.id // push to userByRoleKey lookup array
  user.encoder = {
    key: keyBuf.toString('hex'),
    form,
    jobs: {},
    idleStorage: form.storage,
    capacity: form.capacity,
  }
  DB.idleEncoders.push(userID)
  tryNextAmendments(log) // see if enough providers for new contract
  // Emit event
  const confirmation = { event: { data: [userID], method: 'RegisteredForEncoding' } }
  const event = [confirmation]
  handlers.forEach(([name, handler]) => handler(event))
}
async function unregisterEncoder (user, { name, nonce }, status) {
  unregisterRole ({ user, role: 'encoder', idleProviders: DB.idleEncoders })
}
/*----------------------
  (UN)REGISTER ATTESTOR
------------------------*/
async function _registerAttestor (user, { name, nonce }, status, args) {
  const log = connections[name].log
  const [attestorKey, form] = args
  const userID = user.id
  if (!user.attestor) user.attestor = {}
  if (user.attestor[attestorKey]) return log({ type: 'chain', body: [`User is already registered as a attestor`] })
  const keyBuf = Buffer.from(attestorKey, 'hex')
  DB.userIDByKey[keyBuf.toString('hex')] = user.id // push to userByRoleKey lookup array
  user.attestor = {
    key: keyBuf.toString('hex'),
    form,
    jobs: {},
    idleStorage: form.storage,
    capacity: form.capacity,
  }
  DB.idleAttestors.push(userID)
  tryNextAmendments(log) // see if enough providers for new contract
  findAttestorNewChallengeJob({ attestorID: userID }, log) // check for attestor only jobs (storage & perf challenge)
  // Emit event
  const confirmation = { event: { data: [userID], method: 'RegisteredForAttesting' } }
  const event = [confirmation]
  handlers.forEach(([name, handler]) => handler(event))
}
async function unregisterAttestor (user, { name, nonce }, status) {
  unregisterRole ({ user, role: 'attestor', idleProviders: DB.idleAttestors })
}
/*----------------------
  AMENDMENT REPORT
------------------------*/
async function _amendmentReport (user, { name, nonce }, status, args) {
  const log = connections[name].log
  const [ report ] = args
  console.log('-----------------------------')
  console.log({report})
  const { id: amendmentID, failed } = report
  const amendment = getAmendmentByID(amendmentID)
  const { providers: { hosters, attestors, encoders }, contract: contractID } = amendment
  const contract = getContractByID(contractID)
  const { status: { schedulerID }, plan: planID } = contract
  const plan = getPlanByID(planID)
  var hosterID
  // cancel amendment schedule
  const { scheduleAction, cancelAction } = await scheduler
  cancelAction(schedulerID)

  if (!failed.length) {
    contract.activeHosters = hosters
    hosters.forEach(startChallengePhase)
    removeContractJobs({ amendment, doneJob: `NewAmendment${amendmentID}` }, log)
    return
  }
  const reuse = { hosters: [], encoders: [], attestors }
  for (var len = encoders.length; i < len; i++) {
    const encoderID = encoders[i]
    if (!failed.includes(encoderID)) reuse.encoders.push(encoderID)
  }
  if (!reuse.encoders.length) for (var i = 0, len = hosters.length; i < len; i++) {
    const hosterID = hosters[i]
    if (!failed.includes(hosterID)) {
      reuse.hosters.push(hosterID)
      startChallengePhase(hosterID)
    }
  }
  // @TODO better naming, so that it's clear wat it does
  removeContractJobs({ amendment, doneJob: `NewAmendment${amendmentID}` }, log)
  // if still not enough hosters, make new amendment
  if (contract.activeHosters.length < 3) {
    console.log('Need more hosters')
    const newID = makeDraftAmendment({ contractID, reuse}, log)
    addToPendingAmendments({ amendmentID: newID }, log)
    tryNextAmendments(log)
  }

  function startChallengePhase (hosterID) {
    contract.activeHosters.push(hosterID)
    // Emit event
    console.log(`Hosting started: contract: ${contractID}, amendment: ${amendmentID}, hoster: ${hosterID}`)
    const confirmation = { event: { data: [contractID, hosterID], method: 'HostingStarted' } }
    const event = [confirmation]
    handlers.forEach(([name, handler]) => handler(event))
    scheduleChallenges({ plan, user, hosterID, name, nonce, contractID, status })
  }
}


/*----------------------
  STORAGE CHALLENGE
------------------------*/
async function _requestStorageChallenge ({ user, signingData, status, args }) {
  const { name, nonce } = signingData
  const log = connections[name].log
  const [ contractID, hosterID ] = args
  const contract = getContractByID(contractID)
  const plan = getPlanByID(contract.plan)
  if (!plan.sponsor === user.id) return log({ type: 'chain', body: [`Error: this user can not call this function`] })
  const storageChallenge = makeStorageChallenge({ contract, hosterID, plan }, log)
  // Emit event
  emitChallenge({ method: 'NewStorageChallenge', challengeID: storageChallenge.id }, log)
}
async function _submitStorageChallenge (user, { name, nonce }, status, args) {
  const log = connections[name].log
  const [ response ] = args
  log({ type: 'chain', body: [`Received StorageChallenge ${JSON.stringify(response)}`] })
  const { hashes, storageChallengeID, signature } = response
  const storageChallenge = getStorageChallengeByID(storageChallengeID)
  const attestorID = storageChallenge.attestor
  if (user.id !== attestorID) return log({ type: 'chain', body: [`Only the attestor can submit this storage challenge`] })
  // @TODO validate proof
  const isValid = validateProof(hashes, signature, storageChallenge)
  // emit events
  var method = isValid ? 'StorageChallengeConfirmed' : 'StorageChallengeFailed'
  const res = { event: { data: [storageChallengeID], method } }
  const event = [res]
  handlers.forEach(([name, handler]) => handler(event))
  log({ type: 'chain', body: [`emit chain event ${JSON.stringify(event)}`] })
  // attestor finished job, add them to idleAttestors again
  removeJobForRole({
    id: attestorID,
    role: 'attestor',
    doneJob: `NewStorageChallenge${storageChallengeID}`,
    idleProviders: DB.idleAttestors,
    action: findAttestorNewChallengeJob({ attestorID }, log)
  }, log)
}
/*----------------------
  PERFORMANCE CHALLENGE
------------------------*/
async function _requestPerformanceChallenge ({ user, signingData, status, args }) {
  const { name, nonce } = signingData
  const log = connections[name].log
  const [ contractID, hosterID ] = args
  const plan = getPlanByID(getContractByID(contractID).plan)
  const performanceChallenge = makePerformanceChallenge({ contractID, hosterID, plan }, log)
  // emit event
  emitChallenge({ method: 'NewPerformanceChallenge', challengeID: performanceChallenge.id }, log)
}

async function _submitPerformanceChallenge (user, { name, nonce }, status, args) {
  const log = connections[name].log
  const [ performanceChallengeID, report ] = args
  const userID = user.id
  log({ type: 'chain', body: [`Performance Challenge proof by attestor: ${userID} for challenge: ${performanceChallengeID}`] })
  const performanceChallenge = getPerformanceChallengeByID(performanceChallengeID)
  if (!performanceChallenge.attestors.includes(userID)) return log({ type: 'chain', body: [`Only selected attestors can submit this performance challenge`] })
  // emit events
  if (report) response = { event: { data: [performanceChallengeID], method: 'PerformanceChallengeConfirmed' } }
  else response = { event: { data: [performanceChallengeID], method: 'PerformanceChallengeFailed' } }
  const event = [response]
  handlers.forEach(([name, handler]) => handler(event))
  // log({ type: 'chain', body: [`emit chain event ${JSON.stringify(event)}`] })
  // attestor finished job, add them to idleAttestors again
  removeJobForRole({
    id: userID,
    role: 'attestor',
    doneJob: `NewPerformanceChallenge${performanceChallengeID}`,
    idleProviders: DB.idleAttestors,
    action: findAttestorNewChallengeJob({ attestorID: userID }, log)
  }, log)
}

/******************************************************************************
  HELPERS
******************************************************************************/
const setSize = 10 // every contract is for hosting 1 set = 10 chunks
const size = setSize*64*1024 //assuming each chunk is 64kb
const blockTime = 6000

async function makeContractsAndScheduleAmendments ({ plan }, log) {
  const contractIDs = makeContracts({ plan }, log)
  for (var i = 0, len = contractIDs.length; i < len; i++) {
    const contractID = contractIDs[i]
    const schedulingAmendment = () => {
      const reuse = { encoders: [], attestors: [], hosters: [] }
      const newID = makeDraftAmendment({ contractID, reuse}, log)
      addToPendingAmendments({ amendmentID: newID }, log)
      tryNextAmendments(log)
    }
    const blockNow = header.number
    const delay = plan.from - blockNow
    const { scheduleAction, cancelAction } = await scheduler
    scheduleAction({ action: schedulingAmendment, delay, name: 'schedulingAmendment' })
  }
}
// split plan into sets with 10 chunks
function makeContracts ({ plan }, log) {
  const feeds = plan.feeds
  for (var i = 0; i < feeds.length; i++) {
    const feedObj = feeds[i]
    // split ranges to sets (size = setSize)
    const sets = makeSets({ ranges: feedObj.ranges, setSize })
    return sets.map(set => {
      const contract = {
        plan: plan.id,
        feed: feedObj.id,
        ranges: set,
        amendments: [],
        activeHosters: [],
        status: {}
       }
      const contractID = DB.contracts.push(contract)
      const id = contractID
      contract.id = id
      return id
      log({ type: 'chain', body: [`New Contract: ${JSON.stringify(contract)}`] })
    })
  }
}
// find providers for each contract (+ new providers if selected ones fail)
function makeDraftAmendment ({ contractID, reuse}, log) {
  const contract = getContractByID(contractID)
  log({ type: 'chain', body: [`Searching additional providers for contract: ${contractID}`] })
  const amendment = { contract: contractID }
  const id = DB.amendments.push(amendment)
  amendment.id = id
  console.log('New draft amendment', id)
  amendment.providers = reuse
  contract.amendments.push(id)
  return id
}
function addToPendingAmendments ({ amendmentID }, log) {
  DB.pendingAmendments.push({ amendmentID }) // @TODO sort pendingAmendments based on priority (RATIO!)
}
async function tryNextAmendments (log) {
  const failed = []
  for (var start = new Date(); DB.pendingAmendments.length && new Date() - start < 4000;) {
    const { amendmentID } = DB.pendingAmendments.shift()
    const x = await executeAmendment({ amendmentID }, log)
  }
  failed.forEach(x => addToPendingAmendments(x, log))
}
async function executeAmendment ({ amendmentID }, log) {
  const amendment = getAmendmentByID(amendmentID)
  const contract = getContractByID(amendment.contract)
  const { plan: planID } = getContractByID(amendment.contract)
  const providers = getProviders({
    plan: getPlanByID(planID),
    reused: amendment.providers,
    newJob: `NewAmendment${amendmentID}` }, log)
  if (!providers) {
    log({ type: 'chain', body: [`not enough providers available for this amendment`] })
    return { amendmentID }
  }
  amendment.providers = providers
  // schedule follow up action
  contract.status.schedulerID = await scheduleAmendmentFollowUp({ amendmentID }, log)
  log({ type: 'chain', body: [`New Amendment ${JSON.stringify(amendment)}`] })
  // emit event
  const NewAmendment = { event: { data: [amendmentID], method: 'NewAmendment' } }
  const event = [NewAmendment]
  handlers.forEach(([name, handler]) => handler(event))
  log({ type: 'chain', body: [`emit chain event ${JSON.stringify(event)}`] })
}

function getProviders ({ plan, newJob, reused }, log) {
  const attestorAmount = 1 - (reused?.attestors?.length || 0)
  const encoderAmount = 3 - (reused?.encoders?.length || 0)
  const hosterAmount = 3 - (reused?.hosters?.length || 0)
  const avoid = makeAvoid({ plan })
  if (!reused) reused = { encoders: [], attestors: [], hosters: [] }
  else {
    const reusedArr = [...reused.attestors, ...reused.hosters, ...reused.encoders]
    reusedArr.forEach(id => avoid[id] = true)
  }
  // @TODO backtracking!! try all the options before returning no providers available
  const attestors = select({ idleProviders: DB.idleAttestors, role: 'attestor', newJob, amount: attestorAmount, avoid, plan, log })
  if (!attestors.length) return log({ type: 'chain', body: [`missing attestors`] })
  const encoders = select({ idleProviders: DB.idleEncoders, role: 'encoder',  newJob, amount: encoderAmount, avoid, plan, log })
  if (!encoders.length === encoderAmount) return log({ type: 'chain', body: [`missing encoders`] })
  const hosters = select({ idleProviders: DB.idleHosters, role: 'hoster', newJob, amount: hosterAmount, avoid, plan, log })
  if (!hosters.length === hosterAmount) return log({ type: 'chain', body: [`missing hosters`] })
  return {
    encoders: encoders.concat(reused.encoders),
    hosters: hosters.concat(reused.hosters),
    attestors: attestors.concat(reused.attestors)
  }
}
function getRandom (items) {
  if (!items.length) return
  const pos = Math.floor(Math.random() * items.length)
  const item = items[pos]
  return [item, pos]
}
function getRandomPos(ranges) {
  min = 0
  var max = 0
  for (var j = 0, N = ranges.length; j < N; j++) {
    const range = ranges[j]
    for (var i = range[0]; i <= range[1]; i++) max++
  }
  return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}
function getRandomChunks ({ ranges, chunks }) { // [[0,3], [5,7]]
  var pos = getRandomPos(ranges)
  counter = 0
  for (var j = 0, N = ranges.length; j < N; j++) {
    const range = ranges[j]
    for (var i = range[0]; i <= range[1]; i++) {
      if (counter === pos) return chunks.push(i)
      counter++
    }
  }
}
function validateProof (hashes, signature, storageChallenge) {
  // const chunks = storageChallenge.chunks
  // if (`${chunks.length}` === `${hashes.length}`) return true
  return true
}
function select ({ idleProviders, role, newJob, amount, avoid, plan, log }) {
  idleProviders.sort(() => Math.random() - 0.5) // @TODO: improve randomness
  const selectedProviders = []
  for (var i = 0; i < idleProviders.length; i++) {
    const providerID = idleProviders[i]
    if (avoid[providerID]) continue // if providerID is in avoid, don't select it
    const provider = getUserByID(providerID)
    if (doesQualify({ plan, provider, role })) {
      selectedProviders.push({providerID, index: i, role })
      avoid[providerID] = true
      if (selectedProviders.length === amount) {
        return giveUsersContractJob({ selectedProviders, idleProviders, role, newJob })
      }
    }
  }
  return []
}
function giveUsersContractJob ({ selectedProviders, idleProviders, role, newJob, type }) {
  return selectedProviders.sort((a,b) => a.index > b.index ? 1 : -1).map(({providerID, index, role }) => { // returns an array of providers sorted by their IDs, important because if you splice index 12 first and then try to splice index 6, this 6 is not 6 anymore, but if you splice them sorted, it works
    return addJobForRole({ providerID, idleProviders, role, newJob, index })
  })
}
function removeContractJobs ({ amendment, doneJob }, log) {
  //@TODO payments: for each successfull hosting we pay attestor(1/3), this hoster (full), encoders (full, but just once)
  const { providers: { hosters, attestors, encoders } } = amendment
  hosters.forEach((hosterID, i) => emitDropHosting({ amendmentID: amendment.id, hosterID }, log))
  attestors.map(id =>
    removeJobForRole({
      id,
      role: 'attestor',
      doneJob,
      idleProviders: DB.idleAttestors,
      action: findAttestorNewChallengeJob({ attestorID: id }, log)
    }, log))
  encoders.map(id =>
    removeJobForRole({
      id,
      role: 'encoder',
      doneJob,
      idleProviders: DB.idleEncoders,
      action: tryNextAmendments(log)
    }, log))
}
function addJobForRole ({ providerID, idleProviders, role, newJob, index }) {
  const provider = getUserByID(providerID)
  provider[role].jobs[newJob] = true
  if (!hasCapacity({ provider, role })) idleProviders.splice(index, 1)
  provider[role].idleStorage -= size // @TODO currently we reduce idleStorage for all providers and for all jobs (also challenge)
  return providerID // returns array of selected providers for select function
}
function removeJobForRole ({ id, role, doneJob, idleProviders, action }, log) {
  const provider = getUserByID(id)
  if (provider[role].jobs[doneJob]) {
    log({ type: 'chain', body: [`Removing the job ${doneJob}`] })
    delete provider[role].jobs[doneJob]
    idleProviders.push(id)
    provider[role].idleStorage += size
    action
  }
}
function doesQualify ({ plan, provider, role }) {
  const form = provider[role].form
  if (
    isScheduleCompatible({ plan, form, role }) &&
    hasCapacity({ provider, role }) &&
    hasEnoughStorage({ role, provider })
  ) return true
}
async function isScheduleCompatible ({ plan, form, role }) {
  const blockNow = header.number
  const isAvialableNow = form.from <= blockNow
  const until = form.until
  var jobDuration
  if (role === 'attestor') jobDuration = 3
  if (role === 'encoder') jobDuration = 2 // duration in blocks
  if (role === 'hoster') jobDuration = plan.until.time -  blockNow
  if (isAvialableNow && (until >= (blockNow + jobDuration) || isOpenEnded)) return true
}
function hasCapacity ({ provider, role }) {
  const jobs = provider[role].jobs
  if (Object.keys(jobs).length < provider[role].capacity) return true
}
function hasEnoughStorage ({ role, provider }) {
  if (provider[role].idleStorage > size) return true
}
function findAttestorNewChallengeJob ({ attestorID }, log) {
  if (DB.attestorsJobQueue.length) {
    const next = DB.attestorsJobQueue[0]
    if (next.fnName === 'NewStorageChallenge' && DB.idleAttestors.length) {
      const storageChallenge = next.opts.storageChallenge
      const hosterID = storageChallenge.hoster
      const contract = getContractByID(storageChallenge.contract)
      const plan = getPlanByID(contract.plan)
      const avoid = makeAvoid({ plan })
      avoid[hosterID] = true
      const newJob = `NewStorageChallenge${storageChallenge.id}`
      const [attestorID] = select({ idleProviders: DB.idleAttestors, role: 'attestor', newJob, amount: 1, avoid, plan, log })
      if (attestorID) {
        DB.attestorsJobQueue.shift()
        storageChallenge.attestor = attestorID
        emitChallenge({ method: 'NewStorageChallenge', challengeID: storageChallenge.id }, log)
      }
    }
    if (next.fnName === 'NewPerformanceChallenge' && DB.idleAttestors.length >= 5) {
      const performanceChallenge = next.opts.performanceChallenge
      const hosterID = performanceChallenge.hoster
      const contract = getContractByID(performanceChallenge.contract)
      const plan = getPlanByID(contract.plan)
      const avoid = makeAvoid({ plan })
      avoid[hosterID] = true
      const newJob = `NewPerformanceChallenge${performanceChallenge.id}`
      const attestors = select({ idleProviders: DB.idleAttestors, role: 'attestor', newJob, amount: 5, avoid, plan, log })
      if (attestors.length) {
        DB.attestorsJobQueue.shift()
        performanceChallenge.attestors = attestors
        emitChallenge({ method: 'NewPerformanceChallenge', challengeID: performanceChallenge.id }, log)
      }
    }
  }
}
function unregisterRole ({ user, role, idleProviders }) {
  user[role] = void 0
  for (var i = 0; i < idleProviders.length; i++) {
    const providerID = idleProviders[i]
    if (providerID === id) idleProviders.splice(i, 1)
  }
}
function makeAvoid ({ plan }) {
  const avoid = {}
  avoid[plan.sponsor] = true // avoid[3] = true
  plan.feeds.forEach(feedObj => {
    const feed = getFeedByID(feedObj.id)
    avoid[feed.publisher] = true
  })
  return avoid
}
function emitDropHosting ({ amendmentID, hosterID }, log) {
  const amendment = getAmendmentByID(amendmentID)
  const { feed: feedID } = getContractByID(amendment.contract)
  const doneJob = `NewAmendment${amendmentID}`
  removeJobForRole({
    id: hosterID,
    role: 'hoster',
    doneJob,
    idleProviders: DB.idleHosters,
    action: tryNextAmendments(log)
  }, log)
  // emit event to notify hoster(s) to stop hosting
  const dropHosting = { event: { data: [feedID, hosterID], method: 'DropHosting' } }
  const event = [dropHosting]
  handlers.forEach(([name, handler]) => handler(event))
  log({ type: 'chain', body: [`emit chain event ${JSON.stringify(event)}`] })
  // @TODO ACTION find new provider for the contract (makeAmendment(reuse))
}
function emitChallenge ({ method, challengeID }, log) {
  const newChallenge = { event: { data: [challengeID], method } }
  const event = [newChallenge]
  handlers.forEach(([name, handler]) => handler(event))
  log({ type: 'chain', body: [`emit chain event ${JSON.stringify(event)}`] })
}
function cancelContracts (plan) {
  const contracts = plan.contracts
  for (var i = 0; i < contracts.length; i++) {
    const contractID = contracts[i]
    const contract = getContractByID(contractID)
    // tell hosters to stop hosting
    contract.activeHosters.forEach(({ hosterID, amendmentID }, i) => {
       emitDropHosting({ amendmentID, hosterID }, log)
    })
    contract.activeHosters = []
    // remove from jobs queue
    for (var j = 0; j < DB.pendingAmendments; j++) {
      const draftContract = draftContract[j]
      if (contractID === draftContract) DB.pendingAmendments.splice(j, 1)
    }
  }
}
async function scheduleChallenges ({ plan, user, hosterID, name, nonce, contractID, status }) {
  const schedulingChallenges = async () => {
    // schedule new challenges ONLY while the contract is active (plan.until.time > new Date())
    const planUntil = plan.until.time
    const blockNow = header.number
    if (!(planUntil > blockNow)) return
    // @TODO if (!plan.schedules.length) {}
    // else {} // plan schedules based on plan.schedules
    const planID = plan.id
    const from = plan.from
    // @TODO sort challenge request jobs based on priority (RATIO!) of the sponsors
    _requestStorageChallenge({ user, signingData: { name, nonce }, status, args: [contractID, hosterID] })
    _requestPerformanceChallenge({ user, signingData: { name, nonce }, status, args: [contractID, hosterID] })
    scheduleAction({ action: schedulingChallenges, delay: 5, name: 'schedulingChallenges' })
  }
  const { scheduleAction, cancelAction } = await scheduler
  scheduleAction({ action: schedulingChallenges, delay: 1, name: 'schedulingChallenges' })
}

async function scheduleAmendmentFollowUp ({ amendmentID }, log) {
  const scheduling = () => {
    console.log('scheduleAmendmentFollowUp', sid)
    const amendment = getAmendmentByID(amendmentID)
    const { providers: { encoders, hosters, attestors: [attestorID] }, contract: contractID } = amendment
    const contract = getContractByID(contractID)
    if (contract.activeHosters.length >= 3) return
    removeContractJobs({ amendment, doneJob: `NewAmendment${amendmentID}` }, log)
    const reuse = { attestors: [], encoders, hosters }
    const newID = makeDraftAmendment({ contractID, reuse}, log)
    addToPendingAmendments({ amendmentID: newID }, log)
    return amendmentID
  }
  const { scheduleAction, cancelAction } = await scheduler
  var sid = scheduleAction({ action: scheduling, delay: 5, name: 'scheduleAmendmentFollowUp' })
  return sid
}

async function planValid ({ plan }) {
  const blockNow = header.number
  if ((plan.until.time > plan.from) && ( plan.until.time > blockNow)) return true
}
function makeStorageChallenge({ contract, hosterID, plan }, log) {
  var chunks = []
  getRandomChunks({ ranges: contract.ranges, chunks })
  const storageChallenge = { contract: contract.id, hoster: hosterID, chunks }
  const id = DB.storageChallenges.push(storageChallenge)
  storageChallenge.id = id
  // find attestor
  const avoid = makeAvoid({ plan })
  avoid[hosterID] = true
  const newJob = `NewStorageChallenge${storageChallenge.id}`
  const [attestorID] = select({ idleProviders: DB.idleAttestors, role: 'attestor', newJob, amount: 1, avoid, plan, log })
  if (!attestorID) return DB.attestorsJobQueue.push({ fnName: 'NewStorageChallenge', opts: { storageChallenge } })
  storageChallenge.attestor = attestorID
  return storageChallenge
}
function makePerformanceChallenge ({ contractID, hosterID, plan }, log) {
  const performanceChallenge = { contract: contractID, hoster: hosterID }
  const id = DB.performanceChallenges.push(performanceChallenge)
  performanceChallenge.id = id
  // select attestors
  const avoid = makeAvoid({ plan })
  avoid[hosterID] = true
  const newJob = `NewPerformanceChallenge${performanceChallenge.id}`
  const attestors = select({ idleProviders: DB.idleAttestors, role: 'attestor', newJob, amount: 5, avoid, plan, log })
  if (!attestors.length) return DB.attestorsJobQueue.push({ fnName: 'NewPerformanceChallenge', opts: { performanceChallenge } })
  performanceChallenge.attestors = attestors
  return performanceChallenge
}

function isValidHoster ({ hosters, failedHosters, hosterID }) {
  // is hoster listed in the amendment for hosting and is hoster not listed as failed (by the attestor)
  if (!hosters.includes(hosterID) || failedHosters.includes(hosterID)) return log({ type: 'chain', body: [`Error: this user can not call this function`] })
  return true
}
