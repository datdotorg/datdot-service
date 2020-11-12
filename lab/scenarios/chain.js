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
  if (!user.hoster) user.hoster = {}
  if (user.hoster[hosterKey]) return log({ type: 'chain', body: [`User is already registered as a hoster`] })
  const keyBuf = Buffer.from(hosterKey, 'hex')
  DB.userByHosterKey[keyBuf.toString('hex')] = user.id // push to userByHosterKey lookup array
  user.hoster = {
    key: keyBuf.toString('hex'),
    form,
    jobs: {},
    idleStorage: form.storage,
    capacity: form.capacity,
  }
  DB.idleHosters.push(userID)
  tryNextContractJob(log) // see if enough providers for new contract
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
    const contractID = job.split('NewContract')[1]
    if (contractID) {
      const feedID = getContractByID(contractID).feed
      emitDropHosting({ contractID, hosterID: id}, log)
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
  user.encoder = {
    key: keyBuf.toString('hex'),
    form,
    jobs: {},
    idleStorage: form.storage,
    capacity: form.capacity,
  }
  DB.idleEncoders.push(userID)
  tryNextContractJob(log) // see if enough providers for new contract
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
  user.attestor = {
    key: keyBuf.toString('hex'),
    form,
    jobs: {},
    idleStorage: form.storage,
    capacity: form.capacity,
  }
  DB.idleAttestors.push(userID)
  tryNextContractJob(log) // see if enough providers for new contract
  findAttestorNewJob({ attestorID: userID }, log) // check for attestor only jobs (storage & perf challenge)
  // Emit event
  const confirmation = { event: { data: [userID], method: 'RegisteredForAttesting' } }
  const event = [confirmation]
  handlers.forEach(([name, handler]) => handler(event))
}
async function unregisterAttestor (user, { name, nonce }, status) {
  unregisterRole ({ user, role: 'attestor', idleProviders: DB.idleAttestors })
}
/*----------------------
  HOSTING STARTS
------------------------*/
async function _hostingStarts (user, { name, nonce }, status, args) {
  const log = connections[name].log
  const [ contractID, reports ] = args
  const attestorID = user.id
  const userID = user.id
  const contract = getContractByID(contractID)
  const plan = getPlanByID(contract.plan)
  const { hosters, attestors, encoders, activeHosters, failedHosters } = contract.providers
  var hosterID
  reports.map(report => {
    hosterID = DB.userByHosterKey[report.hosterKey]
    // @TODO figure out when it is encoders !reportStatusOK
    // @TODO add contract ID to user.score.fails.encodings
    if (report.statusOK) { // hosting started
      if (isValidHoster(hosterID)) {
        if (!activeHosters.includes(hosterID)) contract.providers.activeHosters.push(hosterID) // store to contract's active hosters
        // Emit event
        console.log('Hosting started', contractID, hosterID)
        const confirmation = { event: { data: [contractID, hosterID], method: 'HostingStarted' } }
        const event = [confirmation]
        handlers.forEach(([name, handler]) => handler(event))
        // schedule challenges @TODO only for not failed hosters
        scheduleChallenges({ plan, user: getUserByID(hosterID), name, nonce, contractID, status })
      }
    } else { // hosting didn't start
      if (!failedHosters.includes(hosterID)) contract.providers.failedHosters.push(hosterID) // store to contract's failed hosters
      // @TODO add contract ID to user.score.fails.hostings
      // what else to do if report is not OK
    }
    //@TODO payments: for each hostingStarts we pay attestor(1/3), this hoster (full), encoders (full, but just once)
    // remove done jobs for attestor, encoders and failedHosters
    removeContractJobs({ contractID, doneJob: `NewContract${contractID}`, failedHosters: contract.providers.failedHosters, encoders, attestors }, log)
    // make contract amendment
    // makeAmendment({ contractID, avoid, amounts }, log)
  })

  function isValidHoster (hosterID) {
    if (!hosters.includes(hosterID) || failedHosters.includes(hosterID)) return log({ type: 'chain', body: [`Error: this user can not call this function`] })
    return true
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
    action: findAttestorNewJob({ attestorID }, log)
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
    action: findAttestorNewJob({ attestorID: userID }, log)
  }, log)
}

/******************************************************************************
  HELPERS
******************************************************************************/
const setSize = 10 // every contract is for hosting 1 set = 10 chunks
const size = setSize*64*1024 //assuming each chunk is 64kb
const blockTime = 6000

// split plan into orders with 10 chunks
function makeContract ({ plan }, log) {
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
      log({ type: 'chain', body: [`New Draft Contract: ${JSON.stringify(contract)}`] })
      addToContractJobsQueue({ type: 'contract', id: contractID }, log)
    })
  }
}

function addToContractJobsQueue ({ type, id }, log) {
  DB.contractJobsQueue.push({ type, id }) // @TODO sort contractJobsQueue based on priority (RATIO!)
  tryNextContractJob(log)
}
async function tryNextContractJob (log) {
  for (var start = new Date(); DB.contractJobsQueue.length && new Date() - start < 4000;) {
    // remove contract from contractJobsQueue
    const { type, id } = DB.contractJobsQueue.shift()
    if (type === 'contract') {
      console.log('tryNextContractJob => contract')
      findProvidersAndEmitContract({ contractID: id }, log)
    }
    if (type === 'amendment') {
      console.log('tryNextContractJob => Amendment')
      // findProvidersAndEmitAmendment({}, log)
    }
  }
}

function findProvidersAndEmitContract ({ contractID }, log) {
  const contract = getContractByID(contractID)
  const plan = getPlanByID(contract.plan)
  const avoid = makeAvoid({ plan })
  const amounts = { attestorAmount: 1, encoderAmount: 3, hosterAmount: 3 }
  const providers = getProviders({ plan, avoid, amounts, newJob: `NewContract${contractID}` }, log)
  log({ type: 'chain', body: [`Providers in findProvidersAndEmitContract: ${JSON.stringify(providers)}`] })
  if (!providers) {
    addToContractJobsQueue({ type: 'contract', id: contractID }, log)
    return log({ type: 'chain', body: [`not enough providers available for this contract`] })
  }
  contract.providers = providers
  contract.providers.activeHosters = []
  contract.providers.failedHosters = []
  contract.amendments = []
  plan.contracts.push(contractID) // add contract to the plan
  // schedule follow up action
  scheduleContractFollowUp({ contractID }, log)
  log({ type: 'chain', body: [`New Contract ${JSON.stringify(contract)}`] })
  // emit event
  const NewContract = { event: { data: [contractID], method: 'NewContract' } }
  const event = [NewContract]
  handlers.forEach(([name, handler]) => handler(event))
  log({ type: 'chain', body: [`emit chain event ${JSON.stringify(event)}`] })
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
function makeAmendment ({ contractID, avoid, amounts }, log) {
  // @TODO reactivate providers which performed well
  const contract = getContractByID(contractID)
  log({ type: 'chain', body: [`Searching additional providers for contract: ${contractID}`] })
  const amendment = { contract: contractID }
  const id = DB.amendments.push(amendment)
  amendment.id = id
  contract.amendments.push(id)
  // @TODO add getProviders logic here or in tryNewContractJob
  addToContractJobsQueue({ type: 'amendment', id }, log)
}
function getProviders ({ plan, newJob, avoid, amounts }, log) {
  const { attestorAmount, encoderAmount, hosterAmount } = amounts
  const attestors = select({ idleProviders: DB.idleAttestors, role: 'attestor', type: 'contract', newJob, amount: attestorAmount, avoid, plan, log })
  if (!attestors.length) return log({ type: 'chain', body: [`missing attestors`] })
  const encoders = select({ idleProviders: DB.idleEncoders, role: 'encoder', type: 'contract', newJob, amount: encoderAmount, avoid, plan, log })
  if (!encoders.length === encoderAmount) return log({ type: 'chain', body: [`missing encoders`] })
  const hosters = select({ idleProviders: DB.idleHosters, role: 'hoster', type: 'contract', newJob, amount: hosterAmount, avoid, plan, log })
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
function select ({ idleProviders, role, type, newJob, amount, avoid, plan, log }) {
  idleProviders.sort(() => Math.random() - 0.5) // @TODO: improve randomness
  const selectedProviders = []
  for (var i = 0; i < idleProviders.length; i++) {
    const providerID = idleProviders[i]
    if (avoid[providerID]) continue // if providerID is in avoid, don't select it
    const provider = getUserByID(providerID)
    // @TODO see how to check if attestor qualifies for the challenge (not asuming we're searching providers for a contract)
    if (doesQualify({ plan, provider, role, type })) {
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

function addJobForRole ({ providerID, idleProviders, role, newJob, index }) {
  const provider = getUserByID(providerID)
  provider[role].jobs[newJob] = true
  if (!hasCapacity({ provider, role })) idleProviders.splice(index, 1)
  provider[role].idleStorage -= size // @TODO currently we reduce idleStorage for all providers and for all jobs (also challenge)
  return providerID // returns array of selected providers for select function
}
function doesQualify ({ plan, provider, role, type }) {
  const form = provider[role].form
  if (
    isScheduleCompatible({ type, plan, form, role }) &&
    hasCapacity({ provider, role }) &&
    hasEnoughStorage({ role, provider })
  ) return true
}
function isAvailNow ({ form }) {
  const timeNow = Date.parse(new Date())
  if (Date.parse(form.from) <= timeNow) return true
}
function isAvailForJobDuration ({ role, form }) {
  if (form.until === '') return true // open ended
  const timeNow_mili = Date.now() // in milliseconds
  const until_mili = Date.parse(form.until) // in milliseconds
  var jobDuration
  if (role === 'attestor') jobDuration = 24000
  if (role === 'encoder') jobDuration = 12000 // duration in blocks * blocktime (2 * 6000)
  if (until_mili >= (timeNow_mili + jobDuration)) return true
}
function isScheduleCompatible ({ type, plan, form, role }) {
  if (role === 'encoder' || role === 'attestor') {
    if (isAvailNow({ type, form }) && isAvailForJobDuration({ role, form })) return true
  }
  else if (role === 'hoster') {
    const isAvailOpenEnded = (form.until === '')
    const isAvailAfterPlanEnd = (Date.parse(form.until) > Date.parse(plan.until.time))
    if (isAvailNow({ type, form }) && (isAvailOpenEnded || isAvailAfterPlanEnd)) return true
  }
}
function hasCapacity ({ provider, role }) {
  const jobsLen = jobsLength(provider[role].jobs)
  if (jobsLen < provider[role].capacity) return true
}
function hasEnoughStorage ({ role, provider }) {
  if (provider[role].idleStorage > size) return true
}
function jobsLength (obj) { return Object.keys(obj).length }

function findAttestorNewJob ({ attestorID }, log) {
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
      const [attestorID] = select({ idleProviders: DB.idleAttestors, role: 'attestor', type: 'storageChallenge', newJob, amount: 1, avoid, plan, log })
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
      const attestors = select({ idleProviders: DB.idleAttestors, role: 'attestor', type: 'performanceChallenge', newJob, amount: 5, avoid, plan, log })
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
  const { hosters, activeHosters } = contract.providers
  const feedID = contract.feed
  if (activeHosters.includes(hosterID)) {
    activeHosters.map((id, i) => { if (id === hosterID) activeHosters.splice(i, 1) })
  }
  const doneJob = `NewContract${contractID}`
  removeJobForRole({
    id: hosterID,
    role: 'hoster',
    doneJob,
    idleProviders: DB.idleHosters,
    action: tryNextContractJob(log)
  }, log)
  // emit event to notify hoster(s) to stop hosting
  const dropHosting = { event: { data: [feedID, hosterID], method: 'DropHosting' } }
  const event = [dropHosting]
  handlers.forEach(([name, handler]) => handler(event))
  log({ type: 'chain', body: [`emit chain event ${JSON.stringify(event)}`] })
  // @TODO ACTION find new provider for the contract instead pf tryNextContractJob(log)
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
    contract.providers.activeHosters.map((hosterID) => emitDropHosting({ contractID, hosterID }, log))
    for (var j = 0; j < DB.contractJobsQueue; j++) {
      const draftContract = draftContract[j]
      if (contractID === draftContract) DB.contractJobsQueue.splice(j, 1)
    }
  }
}
async function schedulePlan ({ plan }, log) {
  const start = Date.parse(plan.from)
  const now = new Date()
  const difference = (start - now)/1000
  const delay = Math.round(difference/6)
  const schedulingPlan = () => {
    makeContract({ plan }, log)
    tryNextContractJob(log)
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
  schedule({ action: schedulingChallenges, delay: 1, name: 'schedulingChallenges' })
}
async function scheduleContractFollowUp ({ contractID }, log) {
  const contract = getContractByID(contractID)
  const schedulingContractFollowUp = () => {
    const { activeHosters, hosters, attestors, encoders, failedHosters } = contract.providers
    if (!activeHosters.length && !failedHosters.length) { // we are checking if attestor reported back or not => if not (then no active or failed hosters) => we assume attestor failed & make new contract
      log({ type: 'chain', body: [`Contract execution was not succesful!`] })
      console.log('Not successful with contract ${contractID}, let us repeat the process')
      // remove jobs from all providers
      removeContractJobs({ contractID, doneJob: `NewContract${contractID}`, failedHosters: contract.providers.failedHosters, encoders, attestors }, log)
      // make amendment
      const avoid = makeAvoid({ plan: getPlanByID(contract.plan) })
      const [attestorID] = attestors
      avoid[attestorID] = true //  we assume attestor failed
      // @TODO add contract ID to user.score.fails.attestings && attestor.score.fails.attestings.push(contractID)
      const amounts = { attestorAmount: 1 }
      makeAmendment({ contractID, avoid, amounts }, log)
    }
  }
  const schedule = await scheduleAction
  schedule({ action: schedulingContractFollowUp, delay: 5, name: 'schedulingContractFollowUp' })
}
function planValid ({ plan }) {
  const planFrom = Date.parse(plan.from) // verify if plan from/until times are valid @TODO see that all dates translate to same timezone
  const planUntil = Date.parse(plan.until.time)
  const timeNow = Date.parse(new Date())
  if ((planUntil > planFrom) && ( planUntil > timeNow)) return true
}
function removeContractJobs ({ contractID, doneJob, failedHosters, encoders, attestors }, log) {
  failedHosters.map(hoster => emitDropHosting({ contractID, hosterID: hoster}, log))
  attestors.map(id =>
    removeJobForRole({
      id,
      role: 'attestor',
      doneJob,
      idleProviders: DB.idleAttestors,
      action: findAttestorNewJob({ attestorID: id })
    }, log))
  encoders.map(id =>
    removeJobForRole({
      id,
      role: 'encoder',
      doneJob,
      idleProviders: DB.idleEncoders,
      action: tryNextContractJob(log)
    }, log))
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
  const [attestorID] = select({ idleProviders: DB.idleAttestors, role: 'attestor', type: 'storageChallenge', newJob, amount: 1, avoid, plan, log })
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
  const attestors = select({ idleProviders: DB.idleAttestors, role: 'attestor', type: 'performanceChallenge', newJob, amount: 5, avoid, plan, log })
  if (!attestors.length) return DB.attestorsJobQueue.push({ fnName: 'NewPerformanceChallenge', opts: { performanceChallenge } })
  performanceChallenge.attestors = attestors
  return performanceChallenge
}
