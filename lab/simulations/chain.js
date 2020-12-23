const DB = require('../../src/DB')
const makeSets = require('../../src/makeSets')
const blockgenerator = require('../../src/scheduleAction')
const logkeeper = require('./logkeeper')
const priorityQueue = require('./priority-queue')
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
      const { flow, type, data } = JSON.parse(message)
      const [from, id] = flow

      if (id === 0) { // a new connection
        // 1. do we have that user in the database already?
        // 2. is the message verifiable?
        // 3. => add to database

        // OLD:
        // if (!connections[from]) {
        //   connections[from] = { name: from, counter: id, ws, log: log.sub(from) }
        //   handlers.push([from, body => ws.send(JSON.stringify({ body }))])
        // }
        // else return ws.send(JSON.stringify({
        //   cite: [flow], type: 'error', body: 'name is already taken'
        // }))

        return
      }
      // 1. is that message verifiable
      // ...


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

// function getFeedByID (id) { return DB.feeds[id] }
// function getUserByID (id) { return DB.users[id] }
// function getPlanByID (id) { return DB.plans[id] }
// function getContractByID (id) { return DB.contracts[id] }
// function getAmendmentByID (id) { return DB.amendments[id] }
// function getStorageChallengeByID (id) { return DB.storageChallenges[id] }
// function getPerformanceChallengeByID (id) { return DB.performanceChallenges[id] }
function getFeedByID (id) { return getItem(id) }
function getUserByID (id) { return getItem(id) }
function getPlanByID (id) { return getItem(id) }
function getContractByID (id) { return getItem(id) }
function getAmendmentByID (id) { return getItem(id) }
function getStorageChallengeByID (id) { return getItem(id) }
function getPerformanceChallengeByID (id) { return getItem(id) }
// ---
function getFeedByKey (key) {
  const keyBuf = Buffer.from(key, 'hex')
  return DB.feedByKey[keyBuf.toString('hex')]
}
function getUserIDByKey(key) {
  const keyBuf = Buffer.from(key, 'hex')
  return DB.userIDByKey[keyBuf.toString('hex')]
}
/******************************************************************************
  ROUTING (sign & send)
******************************************************************************/
async function signAndSend (body, name, status) {
  const log = connections[name].log
  const { type, args, nonce, address } = body

  status({ events: [], status: { isInBlock:1 } })

  const user = await _loadUser(address, { name, nonce }, status)
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

async function _loadUser (address, { name, nonce }, status) {
  const log = connections[name].log
  let user
  if (DB.userByAddress[address]) {
    const pos = DB.userByAddress[address]
    user = getUserByID(pos)
  }
  else {
    // const id = DB.storage.length
    // user = { id, address: address }
    // DB.storage.push(user) // @NOTE: set id
    const user = { address: address }
    const id = await addItem(user)
    DB.userByAddress[address] = user.id // push to userByAddress lookup array
    log({ type: 'chain', body: [`New user: ${name}, ${user.id}, ${address}`] })
  }
  return user
}
/*----------------------
      STORE ITEM
------------------------*/
function addItem (item) {
  if (id in item) throw new Error('new items cannot have "id" property')
  const id = DB.storage.length
  item.id = id
  DB.storage.push([item])
  return id
}
function getItem (id) {
  if (!Number.isInteger(id)) return
  if (id < 0) return
  const len = DB.storage.length
  if (id >= len) return
  const history = DB.storage[id]
  if (!Array.isArray(history)) return
  const next = history.length
  const item = history[next - 1]
  return item
}
function delItem (id) {
  if (!Number.isInteger(id)) return
  if (id < 0) return
  const len = DB.storage.length
  if (id >= len) return
  const history = DB.storage[id]
  if (!Array.isArray(history)) return
  return !!history.push(void 0)
}
function updateItem (id, item) {
  if (!Number.isInteger(id)) return
  if (id < 0) return
  const len = DB.storage.length
  if (id >= len) return
  const history = DB.storage[id]
  if (!Array.isArray(history)) return
  return !!history.push(item)
}
/*----------------------
      PUBLISH FEED
------------------------*/
// @TODO:
// * we wont start hosting a plan before the check
// * 3 attestors
// * provide signature for highest index in ranges
// * provide all root hash sizes required for ranges
// => native api feed.getRoothashes() provides the values
async function _publishFeed (user, { name, nonce }, status, args) {
  const log = connections[name].log
  const [merkleRoot]  = args
  const [key, {hashType, children}, signature] = merkleRoot
  const keyBuf = Buffer.from(key, 'hex')
  // check if feed already exists
  if (DB.feedByKey[keyBuf.toString('hex')]) return
  // const feedID = DB.feeds.length
  // const feed = { publickey: keyBuf.toString('hex'), meta: { signature, hashType, children } }
  // DB.feeds.push(feed) // @NOTE: set id
  const feedID = await addItem(feed)
  DB.feedByKey[keyBuf.toString('hex')] = feedID
  feed.publisher = user.id
  emitEvent('FeedPublished', [feedID], log)
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
  // const planID = DB.plans.length
  // plan.id = planID
  // DB.plans.push(plan) // store the plan + @NOTE: set id
  const id = await addItem(plan)
  makeContractsAndScheduleAmendments({ plan }, log) // schedule the plan execution
}
async function unpublishPlan (user, { name, nonce }, status, args) {
  const [planID] = args
  const plan = getPlanByID(planID)
  if (!plan.sponsor === user.id) return log({ type: 'chain', body: [`Only a sponsor is allowed to unpublish the plan`] })
  cancelContracts(plan) // remove all hosted and draft contracts
}
/*----------------------
  (UN)REGISTER ROLES
------------------------*/
async function _registerRoles (user, { name, nonce }, status, args) {
  const log = connections[name].log
  if (!verify_registerRoles(args)) throw new Error('invalid args')
  const roles = args
  const registration = [userID]
  for (var i = 0, len = roles.length; i < len; i++) {
    const [role, roleKey, form] = roles[i]
    registered.push(role)
    const userID = user.id
    if (!user[role]) user[role] = {}
    if (user[role][roleKey]) return log({ type: 'chain', body: [`User is already registered as a ${role}`] })
    const keyBuf = Buffer.from(roleKey, 'hex')
    DB.userIDByKey[keyBuf.toString('hex')] = user.id // push to userByRoleKey lookup array
    user[role] = {
      key: keyBuf.toString('hex'),
      form,
      jobs: {},
      idleStorage: form.storage,
      capacity: form.capacity,
    }
    const first = role[0].toUpperCase()
    const rest = role.substring(1)
    DB[`idle${first + rest}`].push(userID)
  }
  // @TODO: replace with: `findNextJob()`
  tryNextAmendments(log) // see if enough providers for new contract
  // tryNextChallenge({ attestorID: userID }, log) // check for attestor only jobs (storage & perf challenge)
  emitEvent(`RegistrationSuccessful`, registration, log)
}
async function unregisterRoles (user, { name, nonce }, status, args) {
  args.forEach(role => {
    const first = role[0].toUpperCase()
    const rest = role.substring(1)
    const idleProviders = DB[`idle${first + rest}s`]
    for (var i = 0; i < idleProviders.length; i++) {
      const providerID = idleProviders[i]
      if (providerID === id) idleProviders.splice(i, 1)
    }
    const { id, [role]: { jobs, key, form } } = user
    const jobIDs = Object.keys(jobs)
    jobsIDs.map(jobID => {
      // @TODO: user[role].jobs
      // => ...see what to do? find REPLACEMENT users?
      if (role === 'hoster') {
        const feedID = getContractByID(contractID).feed
        const contract = getContractByID(contractID)
        for (var i = 0, len = contract.activeHosters.length; i < len; i++) {
          const { hosterID, amendmentID } = contract.activeHosters[i]
          if (hosterID !== user.id) continue
          contract.activeHosters.splice(i, 1)
          removeJobForRolesXXXX({ providers: { hosters: [id] }, jobID: contractID }, log)
        }
      }
      else if (role === 'encoder') {}
      else if (role === 'attestor') {}
    })
    user[role] = void 0
  })
}
/*----------------------
  (UN)REGISTER HOSTER
------------------------*/
async function _registerHoster (user, { name, nonce }, status, args) {
  _registerRoles(user, { name, nonce }, status, ['hoster', ...args])
}
async function unregisterHoster (user, { name, nonce }, status) {
  unregisterRoles(user, { name, nonce }, status, ['hoster'])
}
/*----------------------
  (UN)REGISTER ENCODER
------------------------*/
async function _registerEncoder (user, { name, nonce }, status, args) {
  _registerRoles(user, { name, nonce }, status, ['encoder', ...args])
}
async function unregisterEncoder (user, { name, nonce }, status) {
  unregisterRoles(user, { name, nonce }, status, ['encoder'])
}
/*----------------------
  (UN)REGISTER ATTESTOR
------------------------*/
async function _registerAttestor (user, { name, nonce }, status, args) {
  _registerRoles(user, { name, nonce }, status, ['attestor', ...args])
}
async function unregisterAttestor (user, { name, nonce }, status) {
  unregisterRoles(user, { name, nonce }, status, ['attestor'])
}
/*----------------------
  AMENDMENT REPORT
------------------------*/
async function _amendmentReport (user, { name, nonce }, status, args) {
  const log = connections[name].log
  const [ report ] = args
  console.log('chain received a report -----------------------------')
  console.log({report})
  const { id: amendmentID, failed } = report // [2,6,8]
  const amendment = getAmendmentByID(amendmentID)
  const { providers: { hosters, attestors, encoders }, contract: contractID } = amendment
  const contract = getContractByID(contractID)
  const { status: { schedulerID }, plan: planID } = contract
  const plan = getPlanByID(planID)
  const [attestorID] = attestors
  if (user.id !== attestorID) return log({ type: 'chain', body: [`Error: this user can not submit the attestation`] })
  if (contract.amendments[contract.amendments.length - 1] !== amendmentID) return log({ type: 'chain', body: [`Error: this amendment has expired`] })
  // cancel amendment schedule
  const { scheduleAction, cancelAction } = await scheduler
  if (!schedulerID) console.log('No scheduler in', JSON.stringify(contract))
  cancelAction(schedulerID)
  // no failures, no need for new amendment
  if (!failed.length) {
    // { hosterID, amendmentID }
    contract.activeHosters = hosters
    hosters.forEach(startChallengePhase)
    const amendment = getAmendmentByID(amendmentID)
    removeJobForRolesXXXX({ providers: { attestors, encoders }, jobID: amendmentID }, log)
    // => until HOSTING STARTED event, everyone keeps the data around
    emitEvent('HostingStarted', [amendmentID], log)
    return // SUCCESS
  }
  var reuse
  const [peerID] = failed
  if (attestors.includes(peerID)) {
    // if failed is attestor (report was automatically triggered by amendmentFollowUp)
    const successfulAttestors = attestors.filter(id => !failed.includes(id))
    reuse = { hosters, encoders, attestors: successfulAttestors }
  }
  else if (hosters.includes(peerID)) {
    // else if any of the failed users is a hoster, we know all others did their job and can be reused
    const successfulHosters = hosters.filter(id => !failed.includes(id))
    contract.activeHosters = [...contract.activeHosters, ...successfulHosters]
    successfulHosters.forEach(startChallengePhase)
    reuse = { hosters: successfulHosters, encoders, attestors }
  } else if (encoders.includes(peerID)) {
    // if any of the encoders failed, we know attestor couldn't compare the encoded chunks and couldn't send them to hosters
    // we know all hosters are good, they can be reused
    const successfulEncoders = encoders.filter(id => !failed.includes(id))
    reuse = { hosters, encoders: successfulEncoders, attestors }
  }

  // remove jobs from providers
  const amendment = getAmendmentByID(amendmentID)
  removeJobForRolesXXXX({ providers: amendment.providers, jobID: amendmentID }, log)

  // @TODO: ... who should drop jobs when??? ...
  // => emit Event to STOP JOB for EVERYONE who FAILED
  emitEvent('DropJob', [amendmentID, failed], log)

  // @TODO: add new amendment to contract only after it is taken from the queue
  // @TODO: make amendments small (diffs) and show latest summary of all amendments under contract.activeHosters


  /*************************************************************************
    ... PERFORMANCE BENCHMARK ... ...then continue
  *************************************************************************/

  // make new amendment
  console.log({reuse})
  const newID = await makeDraftAmendment({ contractID, reuse}, log)
  // @TODO ACTION find new provider for the contract (makeAmendment(reuse))
  addToPendingAmendments({ amendmentID: newID }, log)
  tryNextAmendments(log)

  function startChallengePhase (hosterID) {
    const message = { plan, user, hosterID, name, nonce, contractID, status }
    console.log(`Hosting started: contract: ${contractID}, amendment: ${amendmentID}, hoster: ${hosterID}`)
    log({ type: 'chain', body: [`Starting Challenge Phase ${JSON.stringify(message)}`] })
    scheduleChallenges(message)
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
  makeStorageChallenge({ contract, hosterID, plan }, log)
}
async function _submitStorageChallenge (user, { name, nonce }, status, args) {
  const log = connections[name].log
  const [ response ] = args
  log({ type: 'chain', body: [`Received StorageChallenge ${JSON.stringify(response)}`] })

  const { hashes, storageChallengeID, signature } = response  // signed storageChallengeID, signed by hoster

  // const { proof, storageChallengeID, hosterSignature } = response
  // const hash0 // challenged chunk
  // const proof = [hash0, hash1, hash2, hash3, hash4]
  // const parenthash = nodetype+sizeLeft+sizeRight+hashLeft+hashRight

  // @NOTE: sizes for any required proof hash is already on chain
  // @NOTE: `feed/:id/chunk/:v` // size

  const storageChallenge = getStorageChallengeByID(storageChallengeID)
  const attestorID = storageChallenge.attestor
  if (user.id !== attestorID) return log({ type: 'chain', body: [`Only the attestor can submit this storage challenge`] })
  // @TODO validate proof
  const isValid = validateProof(hashes, signature, storageChallenge)
  var method = isValid ? 'StorageChallengeConfirmed' : 'StorageChallengeFailed'
  emitEvent(method, [storageChallengeID], log)
  // attestor finished job, add them to idleAttestors again

  removeJobForRoleYYYY({
    id: attestorID,
    role: 'attestor',
    doneJob: storageChallengeID,
    idleProviders: DB.idleAttestors,
    action: () => tryNextChallenge({ attestorID }, log)
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
  makePerformanceChallenge({ contractID, hosterID, plan }, log)
}

async function _submitPerformanceChallenge (user, { name, nonce }, status, args) {
  const log = connections[name].log
  const [ performanceChallengeID, report ] = args
  const userID = user.id
  log({ type: 'chain', body: [`Performance Challenge proof by attestor: ${userID} for challenge: ${performanceChallengeID}`] })
  const performanceChallenge = getPerformanceChallengeByID(performanceChallengeID)
  if (!performanceChallenge.attestors.includes(userID)) return log({ type: 'chain', body: [`Only selected attestors can submit this performance challenge`] })
  var method = report ? 'PerformanceChallengeFailed' : 'PerformanceChallengeConfirmed'
  emitEvent(method, [performanceChallengeID], log)
  // attestor finished job, add them to idleAttestors again
  removeJobForRoleYYYY({
    id: userID,
    role: 'attestor',

    doneJob: performanceChallengeID,
    idleProviders: DB.idleAttestors,
    action: () => tryNextChallenge({ attestorID: userID }, log)
  }, log)
}

/******************************************************************************
  HELPERS
******************************************************************************/
const setSize = 10 // every contract is for hosting 1 set = 10 chunks
const size = setSize*64*1024 //assuming each chunk is 64kb
const blockTime = 6000

async function makeContractsAndScheduleAmendments ({ plan }, log) {
  const contractIDs = await makeContracts({ plan }, log)
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
async function makeContracts ({ plan }, log) {
  const feeds = plan.feeds
  for (var i = 0; i < feeds.length; i++) {
    const feedObj = feeds[i]
    // split ranges to sets (size = setSize)
    const sets = makeSets({ ranges: feedObj.ranges, setSize })
    return sets.map(set => {
      // const contractID = DB.contracts.length
      const contract = {
        // id: contractID,
        plan: plan.id,
        feed: feedObj.id,
        ranges: set,
        amendments: [],
        activeHosters: [],
        status: {}
       }
      // DB.contracts.push(contract) // @NOTE: set id
      const contractID = await addItem(contract)
      return contractID
      log({ type: 'chain', body: [`New Contract: ${JSON.stringify(contract)}`] })
    })
  }
}
// find providers for each contract (+ new providers if selected ones fail)
async function makeDraftAmendment ({ contractID, reuse}, log) {
  const contract = getContractByID(contractID)
  if (!contract) return log({ type: 'chain', body: [`No contract with this ID: ${contractID}`] })
  log({ type: 'chain', body: [`Searching additional providers for contract: ${contractID}`] })
  // const id = DB.amendments.length
  const amendment = { contract: contractID }
  // DB.amendments.push(amendment) // @NOTE: set id
  const id = await addItem(amendment)
  amendment.providers = reuse
  contract.amendments.push(id)
  return id
}
function addToPendingAmendments ({ amendmentID }, log) {
  DB.pendingAmendments.push({ amendmentID }) // @TODO sort pendingAmendments based on priority (RATIO!)
}
async function tryNextAmendments (log) {
  // const failed = []
  for (var start = new Date(); DB.pendingAmendments.length && new Date() - start < 4000;) {
    const { amendmentID } = DB.pendingAmendments[0]
    const x = await executeAmendment({ amendmentID }, log)
    if (!x) DB.pendingAmendments.shift()
  }
  // failed.forEach(x => addToPendingAmendments(x, log))
}
async function executeAmendment ({ amendmentID }, log) {
  const amendment = getAmendmentByID(amendmentID)
  const contract = getContractByID(amendment.contract)
  const { plan: planID } = getContractByID(amendment.contract)

  const newJob = amendmentID
  const providers = getProviders({ plan: getPlanByID(planID), reused: amendment.providers, newJob }, log)
  if (!providers) {
    log({ type: 'chain', body: [`not enough providers available for this amendment`] })
    return { amendmentID }
  }
  amendment.providers = providers
  // schedule follow up action
  contract.status.schedulerID = await scheduleAmendmentFollowUp({ amendmentID }, log)
  ;['attestor','encoder','hoster'].forEach(role => {
    const first = role[0].toUpperCase()
    const rest = role.substring(1)
    giveJobToRoles({
      type: 'NewAmendment',
      selectedProviders: providers[`${role}s`],
      idleProviders: DB[`idle${first + rest}s`],
      role,
      newJob
    }, log)
  })
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
      if (selectedProviders.length === amount) return selectedProviders
    }
  }
  return []
}
function giveJobToRoles ({ type, selectedProviders, idleProviders, role, newJob }, log) {
  const sortedProviders = selectedProviders.sort((a,b) => a.index > b.index ? 1 : -1)
  const providers = sortedProviders.map(({providerID, index, role }) => {
    const provider = getUserByID(providerID)
    provider[role].jobs[newJob] = true
    // @NOTE: sortedProviders makes sure those with highest index get sliced first
    // so lower indexes are unchanged until they get sliced too
    if (!hasCapacity({ provider, role })) idleProviders.splice(index, 1)
    // @TODO currently we reduce idleStorage for all providers
    // and for all jobs (also challenge)
    // => take care that it is INCREASED again when job is done
    provider[role].idleStorage -= size
    return providerID
  })
  // returns array of selected providers for select function
  // emit event
  console.log(`New event`, type)
  log({ type: 'chain', body: [type, newJob] })
  emitEvent(type, [newJob], log)
  return providers
}


function getJobByID (jobID) {
  return getItem(jobID)
}
// @TODO payments: for each successfull hosting we pay attestor(1/3), this hoster (full), encoders (full, but just once)
async function removeJob ({ providers, jobID }, log) {
  const job = await getJobByID(jobID)
  const types = Object.keys(provider)
  for (var i = 0, ilen = types.length; i < len; i++) {
    const roles = types[i]//.slice(0, -1)
    const peerIDs = providers[roles]
    for (var k = 0, klen = peerIDs.length; k < klen; k++) {
      const id = peerIDs[k]

    }
  }
}

function removeJobForRolesXXXX ({ providers, jobID }, log) {
  const { hosters, attestors, encoders } = providers
  hosters.forEach((hosterID, i) => {
    removeJobForRoleYYYY({
      id: hosterID,
      role: 'hoster',
      doneJob: jobID,
      idleProviders: DB.idleHosters,
      action: () => tryNextAmendments(log)
    }, log)
  })
  encoders.map(id =>
    removeJobForRoleYYYY({
      id,
      role: 'encoder',
      doneJob: jobID,
      idleProviders: DB.idleEncoders,
      action: () => tryNextAmendments(log)
    }, log))
  attestors.map(id =>
    removeJobForRoleYYYY({
      id,
      role: 'attestor',
      doneJob: jobID,
      idleProviders: DB.idleAttestors,
      action: () => tryNextAmendments(log)
    }, log))
}
function removeJobForRoleYYYY ({ id, role, doneJob, idleProviders, action }, log) {
  const provider = getUserByID(id)
  if (provider[role].jobs[doneJob]) {
    log({ type: 'chain', body: [`Removing the job ${doneJob}`] })
    delete provider[role].jobs[doneJob]
    if (!idleProviders.includes(id)) idleProviders.push(id)
    provider[role].idleStorage += size
    action()
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
function tryNextChallenge ({ attestorID }, log) {
  if (DB.attestorsJobQueue.length) {
    const next = DB.attestorsJobQueue[0]
    if (next.fnName === 'NewStorageChallenge' && DB.idleAttestors.length) {
      const storageChallenge = next.opts.storageChallenge
      const hosterID = storageChallenge.hoster
      const contract = getContractByID(storageChallenge.contract)
      const plan = getPlanByID(contract.plan)
      const avoid = makeAvoid({ plan })
      avoid[hosterID] = true

      const newJob = storageChallenge.id
      const attestors = select({ idleProviders: DB.idleAttestors, role: 'attestor', newJob, amount: 1, avoid, plan, log })

      if (attestors.length) {
        DB.attestorsJobQueue.shift()
        storageChallenge.attestor = attestorID
        giveJobToRoles({
          type: 'NewStorageChallenge',
          selectedProviders: attestors,
          idleProviders: DB.idleAttestors,
          role: 'attestor',
          newJob
        }, log)
      }
    }
    if (next.fnName === 'NewPerformanceChallenge' && DB.idleAttestors.length >= 5) {
      const performanceChallenge = next.opts.performanceChallenge
      const hosterID = performanceChallenge.hoster
      const contract = getContractByID(performanceChallenge.contract)
      const plan = getPlanByID(contract.plan)
      const avoid = makeAvoid({ plan })
      avoid[hosterID] = true

      const newJob = performanceChallenge.id
      const attestors = select({ idleProviders: DB.idleAttestors, role: 'attestor', newJob, amount: 5, avoid, plan, log })
      if (attestors.length) {
        DB.attestorsJobQueue.shift()
        performanceChallenge.attestors = attestors
        giveJobToRoles({
          type: 'NewPerformanceChallenge',
          selectedProviders: attestors,
          idleProviders: DB.idleAttestors,
          role: 'attestor',
          newJob
        }, log)
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
function cancelContracts (plan) {
  const contracts = plan.contracts
  for (var i = 0; i < contracts.length; i++) {
    const contractID = contracts[i]
    const contract = getContractByID(contractID)
    // tell hosters to stop hosting
    // @TODO:
    // 1. figure out all active Hostings (=contracts) from plan (= active)
    // 2. figure out all WIP PerfChallenges for contracts from plan
    // 3. figure out all WIP StoreChallenges for contracts from plan
    // 4. figure out all WIP makeHosting (=amendments) from plan (= soon to become active)
    // 5. CHAIN ONLY: figure out all future scheduled makeHostings (=amendments) from plan

// for every hoster in last Amendment user.hoster.jobs[`NewAmendment${amendmentID}`] = false
// for every encoder in last  user.encoder.jobs[`NewAmendment${amendmentID}`] = false
// for every attestor in last  user.attestor.jobs[`NewAmendment${amendmentID}`] = false
// contract.activeHosters = []
// cancel scheduled challenges
// plan.contracts = [] => we need to rename to activeContracts
// add checks in extrinsics for when wip actions (make hostings, challenges) report back to chain =>
//     storageChallengeID
// if (DB.activeStorageChallenges[id] ) const challenge = getStorageChallengeByID(storageChallengeID)

    const queue = priorityQueue(function compare (a, b) { return a.id < b.id ? -1 : 1 })
    // queue.size()
    // queue.add(item) // add item at correct position into queue
    // queue.take(index=0) // get front item and remove it from the queue
    // queue.peek(index=0) // check front item
    // queue.drop(function keep (x) { return item.contract !== id })


    contract.activeHosters.forEach((hosterID, i) => {
      removeJobForRolesXXXX({ providers: { hosters: [hosterID] }, jobID: contractID }, log)
      const { feed: feedID } = getContractByID(contractID)
      // @TODO ACTION find new provider for the contract (makeAmendment(reuse))
      // emit event to notify hoster(s) to stop hosting
      emitEvent('DropHosting', [feedID, hosterID], log)
    })
    contract.activeHosters = []
    // remove from jobs queue
    for (var j = 0; j < DB.pendingAmendments; j++) {
      const amendment = DB.pendingAmendments[j]
      if (contractID === amendment.contract) DB.pendingAmendments.splice(j, 1)
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
    const { providers: { attestors } } = getAmendmentByID(amendmentID)
    // @TODO get all necessary data to call this exstrinsic from the chain
    cosnt report = [amendmentID, failed: attestors]
    const [attestorID] = attestors
    // const user = getUserByID(attestorID)
    _amendmentReport(user, { name, nonce }, status, args: [report])
    //
    // console.log('scheduleAmendmentFollowUp', sid)
    // const contract = getContractByID(contractID)
    // // if (contract.activeHosters.length >= 3) return
    //
    // removeJobForRolesXXXX({ failedHosters: [], amendment, doneJob: `NewAmendment${amendmentID}` }, log)
    // // @TODO update reuse
    // // const reuse = { attestors: [], encoders, hosters }
    // const reuse = { attestors: [], encoders: [], hosters: [] }
    // const newID = makeDraftAmendment({ contractID, reuse}, log)
    // addToPendingAmendments({ amendmentID: newID }, log)
    // return amendmentID
  }
  const { scheduleAction, cancelAction } = await scheduler
  var sid = scheduleAction({ action: scheduling, delay: 10, name: 'scheduleAmendmentFollowUp' })
  return sid
}

async function planValid ({ plan }) {
  const blockNow = header.number
  if ((plan.until.time > plan.from) && ( plan.until.time > blockNow)) return true
}
async function makeStorageChallenge({ contract, hosterID, plan }, log) {
  var chunks = []
  getRandomChunks({ ranges: contract.ranges, chunks })
  // const id  = DB.storageChallenge.length
  const storageChallenge = { contract: contract.id, hoster: hosterID, chunks }
  // DB.storageChallenges.push(storageChallenge) // @NOTE: set id
  const id = await addItem(storageChallenge)
  DB.activeStorageChallenges[id] = true
  // find attestor
  const avoid = makeAvoid({ plan })
  avoid[hosterID] = true

  const newJob = storageChallenge.id
  const [attestorID] = select({ idleProviders: DB.idleAttestors, role: 'attestor', newJob, amount: 1, avoid, plan, log })
  if (!attestorID) return DB.attestorsJobQueue.push({ fnName: 'NewStorageChallenge', opts: { storageChallenge } })
  storageChallenge.attestor = attestorID
  giveJobToRoles({
    type: 'NewStorageChallenge',
    selectedProviders: attestors,
    idleProviders: DB.idleAttestors,
    role: 'attestor',
    newJob
  }, log)
}
async function makePerformanceChallenge ({ contractID, hosterID, plan }, log) {
  // const id = DB.performanceChallenge.length
  const performanceChallenge = { contract: contractID, hoster: hosterID }
  // DB.performanceChallenges.push(performanceChallenge) // @NOTE: set id
  const id = await addItem(performanceChallenge)
  DB.activePerformanceChallenges[id] = true
  // select attestors
  const avoid = makeAvoid({ plan })
  avoid[hosterID] = true

  const newJob = performanceChallenge.id
  const attestors = select({ idleProviders: DB.idleAttestors, role: 'attestor', newJob, amount: 5, avoid, plan, log })
  if (!attestors.length) return DB.attestorsJobQueue.push({ fnName: 'NewPerformanceChallenge', opts: { performanceChallenge } })
  performanceChallenge.attestors = attestors
  giveJobToRoles({
    type: 'NewPerformanceChallenge',
    selectedProviders: attestors,
    idleProviders: DB.idleAttestors,
    role: 'attestor',
    newJob
  }, log)
}

function isValidHoster ({ hosters, failedHosters, hosterID }) {
  // is hoster listed in the amendment for hosting and is hoster not listed as failed (by the attestor)
  if (!hosters.includes(hosterID) || failedHosters.includes(hosterID)) return log({ type: 'chain', body: [`Error: this user can not call this function`] })
  return true
}

function emitEvent (method, data, log) {
  const message = [{ event: { data, method } }]
  handlers.forEach(([name, handler]) => handler(message))
  log({ type: 'chain', body: [`emit chain event ${JSON.stringify(message)}`] })
}
