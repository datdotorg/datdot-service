const DB = require('../../src/DB')
const makeSets = require('../../src/makeSets')
const blockgenerator = require('../../src/scheduleAction')
const logkeeper = require('./logkeeper')
const WebSocket = require('ws')

const connections = {}
const handlers = []

const scheduleAction = init()
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

  return blockgenerator(log.sub('blockgenerator'), blockMessage => {
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
  log({ type: 'chain', body: [`Publishing a plan`] })
  const [plan] = args
  const { feeds, from, until, importance, config, schedules } =  plan

  // verify if plan from/until times are valid
  const planFrom = Date.parse(from)
  const planUntil = Date.parse(until.time)
  const timeNow = Date.parse(new Date())
  if (!((planUntil > planFrom) && ( planUntil > timeNow))) {
    return log({ type: 'chain', body: [`Plan from and/or until are invalid`] })
  }

  const userID = user.id
  plan.sponsor = userID // or patron?
  const planID = DB.plans.push(plan)
  plan.id = planID
  plan.contracts = []
  schedulePlan({ plan }, log)
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
  if (DB.users[userID-1].hosterKey) return log({ type: 'chain', body: [`User is already registered as a hoster`] })
  const keyBuf = Buffer.from(hosterKey, 'hex')
  user.hosterKey = keyBuf.toString('hex')
  user.hosterForm = form
  user.hosterJobs = {}
  DB.idleHosters.push(userID)
  // Emit event
  const confirmation = { event: { data: [userID], method: 'RegisteredForHosting' } }
  const event = [confirmation]
  handlers.forEach(([name, handler]) => handler(event))
  tryActivateDraftContracts(log)
}
async function _registerEncoder (user, { name, nonce }, status, args) {
  const log = connections[name].log
  const userID = user.id
  const [encoderKey, form] = args
  if (DB.users[userID-1].encoderKey) return log({ type: 'chain', body: [`User is already registered as encoder`] })
  const keyBuf = Buffer.from(encoderKey, 'hex')
  user.encoderKey = keyBuf.toString('hex')
  user.encoderForm = form
  user.encoderJobs = {}
  DB.idleEncoders.push(userID)
  // Emit event
  const confirmation = { event: { data: [userID], method: 'RegisteredForEncoding' } }
  const event = [confirmation]
  handlers.forEach(([name, handler]) => handler(event))
  tryActivateDraftContracts(log)
}
async function _registerAttestor (user, { name, nonce }, status, args) {
  const log = connections[name].log
  const userID = user.id
  const [attestorKey, form] = args
  if (DB.users[userID-1].attestorKey) return log({ type: 'chain', body: [`User is already registered as a attestor`] })
  const keyBuf = Buffer.from(attestorKey, 'hex')
  user.attestorKey = keyBuf.toString('hex')
  user.attestorForm = form
  user.attestorJobs = {}
  // Emit event
  const confirmation = { event: { data: [userID], method: 'RegisteredForAttesting' } }
  const event = [confirmation]
  handlers.forEach(([name, handler]) => handler(event))
  // try to activate draft contracts and check attestor jobs
  DB.idleAttestors.push(userID)
  giveAttestorNewJob({ attestorID: userID }, log)
  tryActivateDraftContracts(log)
}
async function unpublishPlan (user, { name, nonce }, status, args) {
  const [planID] = args
  const plan = getPlanByID(planID)
  if (!plan.sponsor === user.id) return log({ type: 'chain', body: [`Only a sponsor is allowed to unpublish the plan`] })
  // remove all hosted and draft contracts
  cancelContracts(plan)
}
async function unregisterHoster (user, { name, nonce }, status) {
  unregisterRole ({ id: user.id, key: user.hosterKey, form: user.hosterForm, idleProviders: DB.idleHosters })
  const contracts = DB.hostings[user.id]
  contracts.map(contractID => {
    const feedID = getContractByID(contractID).feed
    emitDropHosting({ feedID, hosterID: userID}, log)
  })
}
async function unregisterEncoder (user, { name, nonce }, status) {
  unregisterRole ({ id: user.id, key: user.encoderKey, form: user.encoderForm, idleProviders: DB.idleEncoders })
}
async function unregisterAttestor (user, { name, nonce }, status) {
  unregisterRole ({ id: user.id, key: user.attestorKey, form: user.attestorForm, idleProviders: DB.idleAttestors })
}
function unregisterRole ({ id, key, form, idleProviders }) {
  if (key && form) {
    key = void 0
    form = void 0
  }
  for (var i = 0; i < idleProviders.length; i++) {
    const providerID = idleProviders[i]
    if (providerID === id) idleProviders.slice(i, 1)
  }
}
async function _hostingStarts (user, { name, nonce }, status, args) {
  const log = connections[name].log
  const [ contractID ] = args
  const userID = user.id
  const contract = getContractByID(contractID)
  const plan = getPlanByID(contract.plan)
  const { hosters, attestors, encoders, activeHosters } = contract.providers
  if (!hosters.includes(userID)) return log({ type: 'chain', body: [`Error: this user can not call this function`] })
  // store to contract's active hosters
  if (!activeHosters.includes(userID)) activeHosters.push(userID)
  // add to hostings
  DB.hostings[userID] ? DB.hostings[user.id].push(contractID) : DB.hostings[user.id] = [contractID]

  // for each hostingStarts we pay attestor(1/3), this hoster (full), encoders (full, but just once)
  const doneJob = `NewContract${contractID}`
  // Remove Encoders' done jobs
  encoders.map(id => removeDoneJob({ id, jobsType: 'encoderJobs', doneJob, idle: DB.idleEncoders, action: tryActivateDraftContracts(log)}))
  // Remove Attestors' done jobs
  if (activeHosters.length === hosters.length) {
    attestors.map(id => removeDoneJob({ id, jobsType: 'attestorJobs', doneJob, idle: DB.idleAttestors, action: giveAttestorNewJob({ attestorID: id }, log) }))
  }

  // Emit event
  const confirmation = { event: { data: [contractID, userID], method: 'HostingStarted' } }
  const event = [confirmation]
  handlers.forEach(([name, handler]) => handler(event))
  scheduleChallenges({ plan, user, name, nonce, contractID, status })
}
async function _requestStorageChallenge ({ user, signingData, status, args }) {
  const { name, nonce } = signingData
  const log = connections[name].log
  const [ contractID, hosterID ] = args
  const contract = getContractByID(contractID)
  const planID = contract.plan
  const plan = getPlanByID(planID)
  if (!plan.sponsor === user.id) return log({ type: 'chain', body: [`Error: this user can not call this function`] })
  const ranges = contract.ranges // [[0,3], [5,7], [9,11]]
  var chunks = []
  getRandomChunks({ ranges, chunks })
  const storageChallenge = { contract: contractID, hoster: hosterID, chunks }
  const storageChallengeID = DB.storageChallenges.push(storageChallenge)
  storageChallenge.id = storageChallengeID
  // select attestor
  const avoid = makeAvoid({ plan })
  avoid[hosterID] = true
  const [attestorID] = getAttestorsForChallenge({ amount: 1, avoid }, log)
  if (!attestorID) return DB.attestorJobs.push({ fnName: 'emitStorageChallenge', opts: { storageChallenge } })
  storageChallenge.attestor = attestorID
  emitStorageChallenge({ storageChallengeID }, log)
}
async function _submitStorageChallenge (user, { name, nonce }, status, args) {
  const log = connections[name].log
  const [ response ] = args
  const { hashes, storageChallengeID, signature } = response
  const storageChallenge = getStorageChallengeByID(storageChallengeID)
  if (user.id !== storageChallenge.attestor) return log({ type: 'chain', body: [`Only the attestor can submit this storage challenge`] })
  // attestor finished job, add them to idleAttestors again
  const attestorID = storageChallenge.attestor
  const doneJob = `NewStorageChallenge${storageChallengeID}`
  const opts = { id: attestorID, jobsType: 'attestorJobs', doneJob, idle: DB.idleAttestors, action: giveAttestorNewJob({ attestorID }, log) }
  removeDoneJob(opts)
  // @TODO validate proof
  const isValid = validateProof(hashes, signature, storageChallenge)
  let proofValidation
  const data = [storageChallengeID]
  if (isValid) res = { event: { data, method: 'StorageChallengeConfirmed' } }
  else res = { event: { data: [storageChallengeID], method: 'StorageChallengeFailed' } }
  // emit events
  const event = [res]
  handlers.forEach(([name, handler]) => handler(event))
  // log({ type: 'chain', body: [`emit chain event ${JSON.stringify(event)}`] })
}
async function _requestPerformanceChallenge ({ user, signingData, status, args }) {
  const { name, nonce } = signingData
  const log = connections[name].log
  const [ contractID, hosterID ] = args
  const performanceChallenge = { contract: contractID, hoster: hosterID }
  const performanceChallengeID = DB.performanceChallenges.push(performanceChallenge)
  performanceChallenge.id = performanceChallengeID
  const plan = getPlanByID(getContractByID(contractID).plan)
  // select attestors
  const avoid = makeAvoid({ plan })
  avoid[hosterID] = true
  const attestors = getAttestorsForChallenge({ amount: 5, avoid }, log)
  if (!attestors.length) return DB.attestorJobs.push({ fnName: 'emitPerformanceChallenge', opts: { performanceChallenge } })
  performanceChallenge.attestors = attestors
  emitPerformanceChallenge({ performanceChallengeID }, log)
}

async function _submitPerformanceChallenge (user, { name, nonce }, status, args) {
  const log = connections[name].log

  const [ performanceChallengeID, report ] = args
  log({ type: 'chain', body: [`Performance Challenge proof by attestor: ${user.id} for challenge: ${performanceChallengeID}`] })
  const performanceChallenge = getPerformanceChallengeByID(performanceChallengeID)
  if (!performanceChallenge.attestors.includes(user.id)) return log({ type: 'chain', body: [`Only selected attestors can submit this performance challenge`] })
  // attestor finished job, add them to idleAttestors again
  const attestorID = user.id
  const doneJob = `NewPerformanceChallenge${performanceChallengeID}`
  const opts = { id: attestorID, jobsType: 'attestorJobs', doneJob, idle: DB.idleAttestors, action: giveAttestorNewJob({ attestorID }, log) }
  removeDoneJob(opts)
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
const setSize = 10 // every contract is for hosting 10 chunks

// split plan into orders with 10 chunks
function makeDraftContracts ({ plan }, log) {
  const feeds = plan.feeds
  for (var i = 0; i < feeds.length; i++) {
    const feedObj = feeds[i]
    // split ranges to sets (size = setSize)
    const sets = makeSets({ ranges: feedObj.ranges, setSize })
    sets.forEach(set => {
      const contract = { plan: plan.id, feed: feedObj.id, ranges: set }
      const contractID = DB.contracts.push(contract)
      contract.id = contractID
      DB.draftContractsQueue.push(contractID)
      log({ type: 'chain', body: [`New Draft Contract: ${JSON.stringify(contract)}`] })
    })
  }
}
async function tryActivateDraftContracts (log) {
  for (var start = new Date(); DB.draftContractsQueue.length && new Date() - start < 4000;) {
    // remove contract from draftContractsQueue
    const contractID = DB.draftContractsQueue.shift()
    const contract = getContractByID(contractID)
    const plan = getPlanByID(contract.plan)
    console.log('Getting providers')
    const providers = getProviders({ plan }, log)
    if (!providers) {
      DB.draftContractsQueue.unshift(contractID)
      return log({ type: 'chain', body: [`not enough providers available for this feed`] })
    }
     // add jobs to provider and remove from idle if ! hasCapacity
     const newJob = `NewContract${contractID}`
     addJobsToProviders({ providers, newJob })

    contract.providers = providers
    contract.providers.activeHosters = []
    // emit event
    const NewContract = { event: { data: [contractID], method: 'NewContract' } }
    const event = [NewContract]
    handlers.forEach(([name, handler]) => handler(event))
    log({ type: 'chain', body: [`New Contract: ${JSON.stringify(contract)}`] })
    // add contract to the plan
    plan.contracts.push(contractID)
    // follow up action
    scheduleContractFollowUp({ plan, contract }, log)
  }
}
function addJobsToProviders ({ providers, newJob }) {
  const { encoders, hosters, attestors } = providers
  attestors.map(id => {
    const opts = { providerID: id, max: 5, jobsType: 'attestorJobs'}
    addNewJob({ newJob, opts, idleProviders: DB.idleAttestors })
  })
  encoders.map(id => {
    const opts = { providerID: id, max: 3, jobsType: 'encoderJobs'}
    addNewJob({ newJob, opts, idleProviders: DB.idleEncoders })
  })
  hosters.map(id => {
    const hoster = getUserByID(id)
    const opts = { providerID: id, max: hoster.hosterForm.idleStorage, jobsType: 'hosterJobs'}
    addNewJob({ newJob, opts, idleProviders: DB.idleHosters })
  })
}
function addNewJob ({ newJob, opts, idleProviders }) {
  const id = opts.providerID
  const provider = getUserByID(id)
  const providerJobs = provider[opts.jobsType]
  providerJobs[newJob] = true
  if (!hasCapacity(opts)) idleProviders.splice(id, 1)
}
function removeDoneJob ({ id, jobsType, doneJob, idle: idleProviders, action }) {
  const providerJobs = getUserByID(id)[jobsType]
  if (providerJobs[doneJob]) {
    delete providerJobs[doneJob]
    idleProviders.push(id)
    action
  }
}
function findAdditionalProviders (contractID, log) {
  // @TODO INSTEAD OF NEW CONTRACT rather select new hosters and if activeHosters than they send encoded to attestor
  // example, if you need 1 hoster => 2 activeHosters + new encoder, 1 attestor
  const failedContract = getContractByID(contractID)
  const { plan, feed, ranges } = failedContract
  const newContract = { plan, feed, ranges }
  const id = DB.contracts.push(newContract)
  newContract.id = id
  DB.draftContractsQueue.push(id)
  tryActivateDraftContracts(log)
}
function getProviders ({ plan }, log) {
  if (!DB.idleAttestors.length) return log({ type: 'chain', body: [`missing attestors`] })
  if (DB.idleEncoders.length < 3) return log({ type: 'chain', body: [`missing encoders`] })
  if (DB.idleHosters.length < 3) return log({ type: 'chain', body: [`missing hosters`] })

  const avoid = makeAvoid({ plan })

  // get 1 attestor
  const attestorAmount = 1
  const attestorOpts = { idleProviders: DB.idleAttestors, role: 'attestor', amount: attestorAmount, avoid, plan, log }
  const attestors = select(attestorOpts)
  if (!attestors.length) return log({ type: 'chain', body: [`insufficient matching attestors`] })
  // get 3 encoders
  const encoderAmount = 3
  const encoderOpts = { idleProviders: DB.idleEncoders, role: 'encoder', amount: encoderAmount, avoid, plan, log }
  const encoders = select(encoderOpts)
  if (!encoders.length === encoderAmount) return log({ type: 'chain', body: [`insufficient matching encoders`] })
  // get 3 hosters
  const hosterAmount = 3
  const hosterOpts = { idleProviders: DB.idleHosters, role: 'hoster', amount: hosterAmount, avoid, plan, log }
  const hosters = select(hosterOpts)
  if (!hosters.length === hosterAmount) return log({ type: 'chain', body: [`insufficient matching hosters`] })

  return { encoders, hosters, attestors }
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
function getRandomChunks ({ ranges, chunks }) {
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
  const chunks = storageChallenge.chunks
  if (`${chunks.length}` === `${hashes.length}`) return true
}
function select ({ idleProviders, role, amount, avoid, plan, log }) {
  console.log('Starting to select', role)
  idleProviders.sort(() => Math.random() - 0.5) // @TODO: improve randomness
  const selectedProviders = []
  for (var i = 0; i < idleProviders.length; i++) {
    const providerID = idleProviders[i]
    if (avoid[providerID]) continue // if providerID is in avoid, don't select it
    const provider = getUserByID(providerID)
    var opts
    if (role === 'attestor') opts = { providerID, max: 5, jobsType: 'attestorJobs'}
    if (role === 'encoder') opts = { providerID, max: 3, jobsType: 'encoderJobs'}
    if (role === 'hoster') opts = { providerID, max: provider.hosterForm.idleStorage, jobsType: 'hosterJobs'}
    if (doesQualify({ plan, form: provider[`${role}Form`] }) && hasCapacity(opts)) {
      selectedProviders.push(providerID)
      avoid[providerID] = true
      if (selectedProviders.length === amount) return selectedProviders
    }
  }
  return []
}
function doesQualify ({ plan, form }) {
  const { from, until, importance, config, schedules } =  plan
  if (isAvailableFromUntil({ from, until, form })) return true
}
function isAvailableFromUntil ({ from, until, form: providerForm }) {
  const providerFrom = Date.parse(providerForm.from)
  const providerUntil = Date.parse(providerForm.until)
  const planFrom = Date.parse(from)
  const planUntil = Date.parse(until.time)
  const timeNow = Date.parse(new Date())
  if (
    ((planFrom < timeNow && providerFrom <= timeNow) /*plan needed to be published already & provider is avail from now on*/ || providerFrom <= planFrom /*provider avail before or at plan*/ )
    && (providerForm.until === '' /*provider avail until further notice*/ || providerUntil >= planUntil /*provider avail until or after end of plan */)
  ) {
    return true
  }
}
function giveAttestorNewJob ({ attestorID }, log) {
  if (DB.attestorJobs.length) {
    const next = DB.attestorJobs[0]
    console.log('Get new jobs', JSON.stringify(next))
    console.log('IDLE ATTESTORS', DB.idleAttestors)
    if (next.fnName === 'emitStorageChallenge' && DB.idleAttestors.length) {
      const storageChallenge = next.opts.storageChallenge
      const hosterID = storageChallenge.hoster
      const contract = getContractByID(storageChallenge.contract)
      const plan = getPlanByID(contract.plan)
      const avoid = makeAvoid({ plan })
      avoid[hosterID] = true
      const [attestorID] = getAttestorsForChallenge({ amount: 1, avoid }, log)
      if (attestorID) {
        DB.attestorJobs.shift()
        storageChallenge.attestor = attestorID
        emitStorageChallenge({ storageChallengeID: storageChallenge.id }, log)
      }
    }
    if (next.fnName === 'emitPerformanceChallenge' && DB.idleAttestors.length >= 5) {
      const performanceChallenge = next.opts.performanceChallenge
      const hosterID = performanceChallenge.hoster
      const contract = getContractByID(performanceChallenge.contract)
      const plan = getPlanByID(contract.plan)
      const avoid = makeAvoid({ plan })
      avoid[hosterID] = true
      const attestors = getAttestorsForChallenge({ amount: 5, avoid }, log)
      if (attestors.length) {
        DB.attestorJobs.shift()
        performanceChallenge.attestors = attestors
        console.log('Emiting performanceChallenge from JOBS')
        emitPerformanceChallenge( {performanceChallengeID: performanceChallenge.id  }, log)
      }
    }
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

function emitDropHosting ({ feedID, hosterID }, log) {
  // emit event to notify hoster(s) to stop hosting
  const dropHosting = { event: { data: [feedID, hosterID], method: 'DropHosting' } }
  const event = [dropHosting]
  handlers.forEach(([name, handler]) => handler(event))
  log({ type: 'chain', body: [`emit chain event ${JSON.stringify(event)}`] })
  // @TODO find new provider for the contract
}
function emitStorageChallenge ({ storageChallengeID }, log) {
  const storageChallenge = getStorageChallengeByID(storageChallengeID)
  const attestorID = storageChallenge.attestor
  // emit events
  const challenge = { event: { data: [storageChallengeID], method: 'NewStorageChallenge' } }
  const event = [challenge]
  handlers.forEach(([name, handler]) => handler(event))
  log({ type: 'chain', body: [`emit chain event ${JSON.stringify(event)}`] })
}
function emitPerformanceChallenge ({ performanceChallengeID }, log) {
  const performanceChallenge = getPerformanceChallengeByID(performanceChallengeID)
  log({ type: 'chain', body: [`Requesting new PerformanceChallenge: ${performanceChallengeID}`] })
  const challenge = { event: { data: [performanceChallengeID], method: 'NewPerformanceChallenge' } }
  const event = [challenge]
  handlers.forEach(([name, handler]) => handler(event))
  log({ type: 'chain', body: [`emit chain event ${JSON.stringify(event)}`] })
}

function getAttestorsForChallenge ({ amount, avoid }, log) {
  DB.idleAttestors.sort(() => Math.random() - 0.5) // @TODO: improve randomness
  const selectedAttestors = []
  const indexes = []
  for (var i = 0, len = DB.idleAttestors.length; i < len; i++) {
    const attestorID = DB.idleAttestors[i]
    if (avoid[attestorID]) continue // if providerID is in avoid, don't select it
    selectedAttestors.push(attestorID)
    indexes.push(i)
    if (indexes.length === amount) {
      indexes.forEach(index => {
        // remove from idleAttestors if no capacity left
        if (!hasCapacity({ providerID: attestorID, max: 5, jobsType: 'attestorJobs'})) DB.idleAttestors.splice(index, 1) }
      )
      return selectedAttestors
    }
  }
  return []
}

function hasCapacity ({ providerID, max, jobsType }) {
  console.log('Checking if has capacity')
  const provider = getUserByID(providerID)
  console.log('jobsType', jobsType, provider[jobsType])
  if (jobsType === 'attestorJobs' && Object.keys(provider[jobsType]).length < max) return true
  if (jobsType === 'encoderJobs' && Object.keys(provider[jobsType]).length < max) return true
  if (jobsType === 'hosterJobs') {
      const size = setSize*64 //assuming each chunk is 64kb
    if (provider.hosterForm.idleStorage > size) return true
  }
}


function cancelContracts (plan) {
  const contracts = plan.contracts
  for (var i = 0; i < contracts.length; i++) {
    const contractID = contracts[i]
    const contract = getContractByID(contractID)
    contract.providers.activeHosters.map((hosterID) => emitDropHosting({ feedID: contract.feed, hosterID }, log))
    for (var j = 0; j < DB.draftContracts; j++) {
      const draftContract = draftContract[j]
      if (contractID === draftContract) DB.draftContractsQueue.splice(j, 1)
    }
  }
}

// SCHEDULING

async function schedulePlan ({ plan }, log) {
  const start = Date.parse(plan.from)
  const now = new Date()
  const difference = (start - now)/1000
  const delay = Math.round(difference/6)
  const schedulingPlan = () => {
    makeDraftContracts({ plan }, log)
    tryActivateDraftContracts(log)
  }
  const schedule = await scheduleAction
  schedule({ action: schedulingPlan, delay, name: 'schedulingPlan'  })
}
async function scheduleChallenges ({ plan, user, name, nonce, contractID, status }) {
  const schedulingChallenges = () => {

    if (!plan.schedules.length) {}
    else {} // plan schedules based on plan.schedules

    // schedule new challenges ONLY while the contract is active (plan.until.time > new Date())
    const planUntil = Date.parse(plan.until.time)
    const timeNow = Date.parse(new Date())
    if (!(planUntil > timeNow)) return
    const planID = plan.id
    const from = plan.from
    const hosterID = user.id

    _requestStorageChallenge({ user, signingData: { name, nonce }, status, args: [contractID, hosterID] })
    _requestPerformanceChallenge({ user, signingData: { name, nonce }, status, args: [contractID, hosterID] })
      schedule({ action: schedulingChallenges, delay: 5, name: 'schedulingChallenges' })
  }
  const schedule = await scheduleAction
  schedule({ action: schedulingChallenges, delay: 1, name: 'schedulingChallenges' })
}
async function scheduleContractFollowUp ({ plan, contract }, log) {
  const schedulingContractFollowUp = () => {
    const contractID = contract.id
    const activeHosters = contract.providers.activeHosters
    if (activeHosters.length < 3) {
      log({ type: 'chain', body: [`Making additional contract since we do not have enough hosters`] })
      const selectedHosters = contract.providers.hosters
      const failedHosters = selectedHosters.filter(hoster => !activeHosters.includes(hoster))
      failedHosters.map(hoster => emitDropHosting({ feedID: contract.feed, hosterID: hoster}, log))
      // findAdditionalProviders(contractID, log)
      const [attestorID] = contract.providers.attestors
      giveAttestorNewJob({ attestorID }, log)
    }
  }
  const schedule = await scheduleAction
  schedule({ action: schedulingContractFollowUp, delay: 5, name: 'schedulingContractFollowUp' })
}
