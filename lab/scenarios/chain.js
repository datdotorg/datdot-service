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
  schedulePlan({ plan }, log) // schedule the plan execution
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
  if (DB.users[userID-1].hosterKey) return log({ type: 'chain', body: [`User is already registered as a hoster`] })
  const keyBuf = Buffer.from(hosterKey, 'hex')
  user.hosterKey = keyBuf.toString('hex')
  user.hosterForm = form
  user.hosterJobs = {} // needs identifiers so we can remove cancelled plans
  DB.idleHosters.push(userID)
  tryActivateDraftContracts(log) // see if enough providers for new contract
  // Emit event
  const confirmation = { event: { data: [userID], method: 'RegisteredForHosting' } }
  const event = [confirmation]
  handlers.forEach(([name, handler]) => handler(event))
  // log({ type: 'chain', body: [`emit chain event ${JSON.stringify(event)}`] })
}
async function unregisterHoster (user, { name, nonce }, status) {
  const { id, hosterKey, hosterForm, hosterJobs } = user
  unregisterRole ({ id, key: hosterKey, form: hosterForm, idleProviders: DB.idleHosters })
  const jobs = Object.keys(hosterJobs)
  jobs.map(job => {
    const contractID = job.split('NewContract')[1]
    if (contractID) {
      const feedID = getContractByID(contractID).feed
      emitDropHosting({ contractID, hosterID: id}, log)
    }
  })
  hosterJobs = {}
}
/*----------------------
  (UN)REGISTER ENCODER
------------------------*/
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
  tryActivateDraftContracts(log) // see if enough providers for new contract
  // Emit event
  const confirmation = { event: { data: [userID], method: 'RegisteredForEncoding' } }
  const event = [confirmation]
  handlers.forEach(([name, handler]) => handler(event))
}
async function unregisterEncoder (user, { name, nonce }, status) {
  unregisterRole ({ id: user.id, key: user.encoderKey, form: user.encoderForm, idleProviders: DB.idleEncoders })
}
/*----------------------
  (UN)REGISTER ATTESTOR
------------------------*/
async function _registerAttestor (user, { name, nonce }, status, args) {
  const log = connections[name].log
  const [attestorKey, form] = args
  const userID = user.id
  if (DB.users[userID-1].attestorKey) return log({ type: 'chain', body: [`User is already registered as a attestor`] })
  const keyBuf = Buffer.from(attestorKey, 'hex')
  user.attestorKey = keyBuf.toString('hex')
  user.attestorForm = form
  user.attestorJobs = {}
  DB.idleAttestors.push(userID)
  tryActivateDraftContracts(log) // see if enough providers for new contract
  giveAttestorNewJob({ attestorID: userID }, log) // check for attestor only jobs (storage & perf challenge)
  // Emit event
  const confirmation = { event: { data: [userID], method: 'RegisteredForAttesting' } }
  const event = [confirmation]
  handlers.forEach(([name, handler]) => handler(event))
}
async function unregisterAttestor (user, { name, nonce }, status) {
  unregisterRole ({ id: user.id, key: user.attestorKey, form: user.attestorForm, idleProviders: DB.idleAttestors })
}
/*----------------------
  HOSTING STARTS
------------------------*/
async function _hostingStarts (user, { name, nonce }, status, args) {
  const log = connections[name].log
  const [ contractID ] = args
  const userID = user.id
  console.log('Hosting started', contractID, userID)
  const contract = getContractByID(contractID)
  const plan = getPlanByID(contract.plan)
  const { hosters, attestors, encoders, activeHosters } = contract.providers
  // @TODO how to store failed hosters so they don't submit hostingStarted later
  // contract.failedHosters.push...
  if (!hosters.includes(userID)) return log({ type: 'chain', body: [`Error: this user can not call this function`] })
  if (!activeHosters.includes(userID)) activeHosters.push(userID) // store to contract's active hosters
  // Emit event
  const confirmation = { event: { data: [contractID, userID], method: 'HostingStarted' } }
  const event = [confirmation]
  handlers.forEach(([name, handler]) => handler(event))
  // remove done jobs for attestor and encoders
  removeJobs({ doneJob: `NewContract${contractID}`, activeHosters, hosters, encoders, attestors }, log)
  // schedule challenges @TODO only for not failed hosters
  scheduleChallenges({ plan, user, name, nonce, contractID, status })
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
  emitStorageChallenge({ storageChallengeID: storageChallenge.id }, log)
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
  removeJob({
    id: attestorID,
    jobsType: 'attestorJobs',
    doneJob: `NewStorageChallenge${storageChallengeID}`,
    idleProviders: DB.idleAttestors,
    action: giveAttestorNewJob({ attestorID }, log)
  })
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
  emitPerformanceChallenge({ performanceChallengeID: performanceChallenge.id }, log)
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
  removeJob({
    id: userID,
    jobsType: 'attestorJobs',
    doneJob: `NewPerformanceChallenge${performanceChallengeID}`,
    idleProviders: DB.idleAttestors,
    action: giveAttestorNewJob({ attestorID: userID }, log)
  })
}

/******************************************************************************
  HELPERS
******************************************************************************/
const setSize = 10 // every contract is for hosting 10 chunks
const size = setSize*64 //assuming each chunk is 64kb

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
      const id = contractID
      contract.id = id
      DB.draftContractsQueue.push(contractID) // @TODO sort draftContractsQueue based on priority (RATIO!)
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
    const providers = getProviders({ plan }, log)
    log({ type: 'chain', body: [`Providers in tryActivateDraftContracts: ${JSON.stringify(providers)}`] })
    if (!providers) {
      DB.draftContractsQueue.unshift(contractID)
      return log({ type: 'chain', body: [`not enough providers available for this feed`] })
    }
    contract.providers = providers
    contract.providers.activeHosters = []
    // add contract to the plan
    plan.contracts.push(contractID)
    // add jobs to provider and remove from idle if ! hasCapacity
    const newJob = `NewContract${contractID}`
    addJobs({ providers, newJob }, log)
    log({ type: 'chain', body: [`New Contract ${JSON.stringify(contract)}`] })
    // emit event
    const NewContract = { event: { data: [contractID], method: 'NewContract' } }
    const event = [NewContract]
    handlers.forEach(([name, handler]) => handler(event))
    log({ type: 'chain', body: [`emit chain event ${JSON.stringify(event)}`] })
    // follow up action
    scheduleContractFollowUp({ plan, contract }, log)
  }
}
function addJobs ({ providers, newJob }, log) {
  const { encoders, hosters, attestors } = providers
  attestors.map(id => {
    const attestor = getUserByID(id)
    attestor.attestorJobs[newJob] = true
    if (!hasCapacity({ provider: attestor, role: 'attestor' })) DB.idleAttestors.splice(id, 1)
  })
  encoders.map(id => {
    const encoder = getUserByID(id)
    encoder.encoderJobs[newJob] = true
    if (!hasCapacity({ provider: encoder, role: 'encoder' })) DB.idleEncoders.splice(id, 1)
  })
  hosters.map(id => {
    const hoster = getUserByID(id)
    hoster.hosterJobs[newJob] = true
    hoster.hosterForm.idleStorage -= size
    if (!hasCapacity({ provider: hoster, role: 'hoster' })) DB.idleHosters.splice(id, 1)
  })
}

function removeJob ({ id, jobsType, doneJob, idleProviders, action }) {
  const provider = getUserByID(id)
  const providerJobs = provider[jobsType]
  if (providerJobs[doneJob]) {
    delete providerJobs[doneJob]
    idleProviders.push(id)
    if (jobsType === 'hosterJobs') provider.hosterForm.idleStorage += size
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
  const avoid = makeAvoid({ plan })
  const attestorAmount = 1
  const attestors = select({ idleProviders: DB.idleAttestors, role: 'attestor', amount: attestorAmount, avoid, plan, log })
  if (!attestors.length) return log({ type: 'chain', body: [`missing attestors`] })
  const encoderAmount = 3
  const encoders = select({ idleProviders: DB.idleEncoders, role: 'encoder', amount: encoderAmount, avoid, plan, log })
  if (!encoders.length === encoderAmount) return log({ type: 'chain', body: [`missing encoders`] })
  const hosterAmount = 3
  const hosters = select({ idleProviders: DB.idleHosters, role: 'hoster', amount: hosterAmount, avoid, plan, log })
  if (!hosters.length === hosterAmount) return log({ type: 'chain', body: [`missing hosters`] })
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
  // const chunks = storageChallenge.chunks
  // if (`${chunks.length}` === `${hashes.length}`) return true
  return true
}
function select ({ idleProviders, role, amount, avoid, plan, log }) {
  idleProviders.sort(() => Math.random() - 0.5) // @TODO: improve randomness
  const selectedProviders = []
  for (var i = 0; i < idleProviders.length; i++) {
    const providerID = idleProviders[i]
    if (avoid[providerID]) continue // if providerID is in avoid, don't select it
    const provider = getUserByID(providerID)
    if (doesQualify({ plan, provider, role })) {
      selectedProviders.push(providerID)
      avoid[providerID] = true
      if (selectedProviders.length === amount) return selectedProviders
    }
  }
  return []
}
function doesQualify ({ plan, provider, role }) {
  const { from, until, importance, config, schedules } =  plan
  if (
    isAvailableFromUntil({ from, until, provider, role }) &&
    hasCapacity({ provider, role })
  ) return true
}
function isAvailableFromUntil ({ from, until, provider, role }) {
  const form = provider[`${role}Form`]
  const providerFrom = Date.parse(form.from)
  const providerUntil = Date.parse(form.until)
  const planFrom = Date.parse(from)
  const planUntil = Date.parse(until.time)
  const timeNow = Date.parse(new Date())
  if (
    // plan from is in the past & provider is avail from now on || provider avail before or at plan
    ((planFrom < timeNow && providerFrom <= timeNow) || providerFrom <= planFrom  ) &&
    // provider avail open ended || provider avail until or after end of plan
    (form.until === '' || providerUntil >= planUntil)
  ) return true
}
function hasCapacity ({ provider, role }) {
  // @TODO
  const attestorCap // formResources devided by resources needed for a job
  const encoderCap
  const hosterCap
  if (role === 'attestor' && Object.keys(provider['attestorJobs']).length < 10) return true
  if (role === 'encoder' && Object.keys(provider['encoderJobs']).length < 10) return true
  if (role === 'hoster' && (provider.hosterForm.idleStorage > size)) return true
  // if (role === 'attestor' && Object.keys(provider['attestorJobs']).length < 1) return true
  // if (role === 'encoder' && Object.keys(provider['encoderJobs']).length < 1) return true
  // if (role === 'hoster' && (provider.hosterForm.idleStorage > size) && Object.keys(provider['hosterJobs']).length < 1) return true
}
function giveAttestorNewJob ({ attestorID }, log) {
  if (DB.attestorsJobQueue.length) {
    const next = DB.attestorsJobQueue[0]
    if (next.fnName === 'emitStorageChallenge' && DB.idleAttestors.length) {
      const storageChallenge = next.opts.storageChallenge
      const hosterID = storageChallenge.hoster
      const contract = getContractByID(storageChallenge.contract)
      const plan = getPlanByID(contract.plan)
      const avoid = makeAvoid({ plan })
      avoid[hosterID] = true
      const [attestorID] = getAttestorsForChallenge({ amount: 1, avoid }, log)
      if (attestorID) {
        DB.attestorsJobQueue.shift()
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
        DB.attestorsJobQueue.shift()
        performanceChallenge.attestors = attestors
        emitPerformanceChallenge( {performanceChallengeID: performanceChallenge.id  }, log)
      }
    }
  }
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
function makeAvoid ({ plan }) {
  const avoid = {}
  avoid[plan.sponsor] = true // avoid[3] = true
  plan.feeds.forEach(feedObj => {
    const feed = getFeedByID(feedObj.id)
    avoid[feed.publisher] = true
  })
  return avoid
}
function emitDropHosting ({ contractID, hosterID }, log) {
  const contract = getContractByID(contractID)
  const feedID = contract.feed
  // emit event to notify hoster(s) to stop hosting
  const dropHosting = { event: { data: [feedID, hosterID], method: 'DropHosting' } }
  const event = [dropHosting]
  handlers.forEach(([name, handler]) => handler(event))
  log({ type: 'chain', body: [`emit chain event ${JSON.stringify(event)}`] })
  const doneJob = `NewContract${contractID}`
  removeJob({ id: hosterID, jobsType: 'hosterJobs', doneJob, idleProviders: DB.idleHosters, action: tryActivateDraftContracts(log) })
  // @TODO ACTION find new provider for the contract instead pf tryActivateDraftContracts(log)
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
    const id = DB.idleAttestors[i]
    if (avoid[id]) continue // if providerID is in avoid, don't select it
    selectedAttestors.push(id)
    indexes.push(i)
    const provider = getUserByID(id)
    if (indexes.length === amount) {
      indexes.forEach(I => { if (!hasCapacity({ provider, role: 'attestor' })) DB.idleAttestors.splice(I, 1) })
      return selectedAttestors
    }
  }
  return []
}
function cancelContracts (plan) {
  const contracts = plan.contracts
  for (var i = 0; i < contracts.length; i++) {
    const contractID = contracts[i]
    const contract = getContractByID(contractID)
    contract.providers.activeHosters.map((hosterID) => emitDropHosting({ contractID, hosterID }, log))
    for (var j = 0; j < DB.draftContractsQueue; j++) {
      const draftContract = draftContract[j]
      if (contractID === draftContract) DB.draftContractsQueue.splice(j, 1)
    }
  }
}
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
    // schedule new challenges ONLY while the contract is active (plan.until.time > new Date())
    const planUntil = Date.parse(plan.until.time)
    const timeNow = Date.parse(new Date())
    if (!(planUntil > timeNow)) return
    // @TODO if (!plan.schedules.length) {}
    // else {} // plan schedules based on plan.schedules
    const planID = plan.id
    const from = plan.from
    const hosterID = user.id
    // @TODO sort challenge request jobs based on priority (RATIO!) of the sponsors
    _requestStorageChallenge({ user, signingData: { name, nonce }, status, args: [contractID, hosterID] })
    _requestPerformanceChallenge({ user, signingData: { name, nonce }, status, args: [contractID, hosterID] })
    schedule({ action: schedulingChallenges, delay: 5, name: 'schedulingChallenges' })
  }
  const schedule = await scheduleAction
  // @TODO challenges should not start before scheduleContractFollowUp runs through as it may drop some failed hosters
  // failed hosters should be dropped by contractFollowUp action (x blocks after new contract)
  // so scheduleChallenges should start no sooner than x blocks + something, after first hostingStarted is reported
  schedule({ action: schedulingChallenges, delay: 15, name: 'schedulingChallenges' })
}
async function scheduleContractFollowUp ({ plan, contract }, log) {
  const schedulingContractFollowUp = () => {
    const contractID = contract.id
    const { activeHosters, hosters, attestors } = contract.providers
    if (activeHosters.length < 3) {
      log({ type: 'chain', body: [`Making additional contract since we do not have enough hosters`] })
      const failedHosters = hosters.filter(hoster => !activeHosters.includes(hoster))
      console.log('hosters', JSON.stringify(hosters))
      console.log('activeHosters', JSON.stringify(activeHosters))
      console.log('failedHosters', JSON.stringify(failedHosters))
      failedHosters.map(hoster => emitDropHosting({ contractID, hosterID: hoster}, log))
      // findAdditionalProviders(contractID, log)
      const [attestorID] = attestors
      removeJob({
        id: attestorID,
        jobsType: 'attestorJobs',
        doneJob: `NewContract${contractID}`,
        idleProviders: DB.idleAttestors,
        action: giveAttestorNewJob({ attestorID }, log)
      })
    }
  }
  const schedule = await scheduleAction
  schedule({ action: schedulingContractFollowUp, delay: 10, name: 'schedulingContractFollowUp' })
}
function planValid ({ plan }) {
  const planFrom = Date.parse(plan.from) // verify if plan from/until times are valid @TODO see that all dates translate to same timezone
  const planUntil = Date.parse(plan.until.time)
  const timeNow = Date.parse(new Date())
  if ((planUntil > planFrom) && ( planUntil > timeNow)) return true
}
function removeJobs ({ doneJob, activeHosters, hosters, encoders, attestors }, log) {
  encoders.map(id => removeJob({ id, jobsType: 'encoderJobs', doneJob, idleProviders: DB.idleEncoders, action: tryActivateDraftContracts(log)}))
  if (activeHosters.length === hosters.length) { // if all hosters for that contract started hosting
    attestors.map(id => removeJob({ id, jobsType: 'attestorJobs', doneJob, idleProviders: DB.idleAttestors, action: giveAttestorNewJob({ attestorID: id }, log) }))
  } // @TODO payments: for each hostingStarts we pay attestor(1/3), this hoster (full), encoders (full, but just once)
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
  const [attestorID] = getAttestorsForChallenge({ amount: 1, avoid }, log)
  if (!attestorID) return DB.attestorsJobQueue.push({ fnName: 'emitStorageChallenge', opts: { storageChallenge } })
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
  const attestors = getAttestorsForChallenge({ amount: 5, avoid }, log)
  if (!attestors.length) return DB.attestorsJobQueue.push({ fnName: 'emitPerformanceChallenge', opts: { performanceChallenge } })
  performanceChallenge.attestors = attestors
  return performanceChallenge
}
