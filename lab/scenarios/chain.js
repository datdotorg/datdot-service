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
  const userID = user.id
  plan.sponsor = userID // or patron?
  const planID = DB.plans.push(plan)
  plan.id = planID
  plan.contracts = []

  const start = Date.parse(plan.from)
  const now = new Date()
  const difference = (start - now)/1000
  const delay = Math.round(difference/6)
  // if delay is negative, take delay 0 => @TODO adapt scheduler to execute right away if delay is 0

  const schedulePlan = () => {
    makeDraftContracts({ plan }, log)
    activateContracts(log)
  }
  const schedule = await scheduleAction
  schedule({ action: schedulePlan, delay })

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
  activateContracts(log)
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
  activateContracts(log)
}
async function _registerAttestor (user, { name, nonce }, status, args) {
  const log = connections[name].log
  const userID = user.id
  const [attestorKey, form] = args
  if (DB.users[userID-1].attestorKey) return log({ type: 'chain', body: [`User is already registered as a attestor`] })
  const keyBuf = Buffer.from(attestorKey, 'hex')
  DB.users[userID - 1].attestorKey = keyBuf.toString('hex')
  DB.users[userID - 1].attestorForm = form
  const attestorID = userID
  giveAttestorNewJob(attestorID, log)
  activateContracts(log)
}

async function unpublishPlan (user, { name, nonce }, status, args) {
  const [planID] = args
  const plan = getPlanByID(planID)
  // @TODO remove also all contracts
  const contracts = plan.contracts // [1,3,6]
  // if contract still unhosted, remove it from DB.draftContracts
  for (var i = 0; i < contracts.length; i++) {
    const contractID = contracts[i]
    for (var j = 0; j < DB.draftContracts; j++) {
      const draftContract = draftContract[j] // 1,3
      if (contractID === draftContract) DB.draftContracts.splice(j, 1)
    }
    // @TODO dropHosting (if hosted notify hoster to stop hosting && cancel all schedules challenges) && partially pay hoster (= pay until that block))
  }
  if (!plan.sponsor === user.id) return log({ type: 'chain', body: [`Only a sponsor is allowed o unpublish the plan`] })
}
async function unregisterHoster (user, { name, nonce }, status) {
  unregisterRole ({ id: user.id, key: user.hosterKey, form: user.hosterForm, idleProviders: DB.idleHosters })
  // @TODO dropHosting (if hoster was hosting anything && same set of ranges is hosted by less than 3 hosters, then findAdditionalProviders())
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
  const contract = DB.contracts[contractID - 1]
  const plan = getPlanByID(contract.plan)
  const hosters = contract.providers.hosters
  if (!hosters.includes(userID)) return log({ type: 'chain', body: [`Error: this user can not call this function`] })
  const activeHosters = contract.activeHosters
  if (!activeHosters.includes(userID)) activeHosters.push(userID)
  // for each hostingStarts we pay attestor(1/3), this hoster (full), encoders (full, but just once)
  // encoders finished their job, make them idle again
  const encoders = contract.providers.encoders
  for (var i = 0; i < encoders.length; i++) {
    if (!DB.idleEncoders.includes(encoders[i])) DB.idleEncoders.push(encoders[i])
    activateContracts(log)
  }
  if (activeHosters.length === hosters.length) {
    // atestor finished their job, make them idle again
    const attestorID = contract.providers.attestor
    if (!DB.idleAttestors.includes(attestorID)) giveAttestorNewJob(attestorID, log)
  }
  const confirmation = { event: { data: [contractID, userID], method: 'HostingStarted' } }
  const event = [confirmation]
  handlers.forEach(([name, handler]) => handler(event))

  const scheduleChallenges = () => {
    // @TODO schedule new challenges while the contract is active (plan.until.time > new Date())
    if (!plan.schedules.length) {
      const planID = DB.contracts[contractID - 1].plan
      const plan = getPlanByID(planID)
      const from = plan.from
      const until = plan.until.time
      const hosterID = user.id
      // request challenges for the hoster
      _requestStorageChallenge({ user, signingData: { name, nonce }, status, args: [contractID, hosterID] })
      _requestPerformanceChallenge({ user, signingData: { name, nonce }, status, args: [contractID, hosterID] })
      schedule({ action: scheduleChallenges, delay: 5 })
    } else {
      // plan schedules based on plan.schedules
    }
  }
  const schedule = await scheduleAction
  schedule({ action: scheduleChallenges, delay: 1 })
}

async function _requestStorageChallenge ({ user, signingData, status, args }) {
  const { name, nonce } = signingData
  const log = connections[name].log
  const [ contractID, hosterID ] = args
  const planID = DB.contracts[contractID - 1].plan
  const plan = DB.contracts[planID - 1]
  if (!plan.sponsor === user.id) return log({ type: 'chain', body: [`Error: this user can not call this function`] })
  const ranges = DB.contracts[contractID - 1].ranges // [ [0, 3], [5, 7] ]
  // @TODO currently we check one random chunk in each range => find better logic
  const chunks = ranges.map(range => getRandomInt(range[0], range[1] + 1))
  const storageChallenge = { contract: contractID, hoster: hosterID, chunks }
  const storageChallengeID = DB.storageChallenges.push(storageChallenge)
  storageChallenge.id = storageChallengeID
  const [attestorID] = getAttestorForChallenge(storageChallenge, log)
  if (attestorID) assignAttestorAndEmitStorageChallenge({ attestorID, storageChallenge, log })
  else DB.attestorJobs.push({ fnName: 'assignAttestorAndEmitStorageChallenge', opts: { attestorID, storageChallenge, log }})
}
async function _submitStorageChallenge (user, { name, nonce }, status, args) {
  const log = connections[name].log

  const [ storageChallengeID, proofs ] = args
  const storageChallenge = DB.storageChallenges[storageChallengeID - 1]
  if (user.id !== storageChallenge.attestor) return log({ type: 'chain', body: [`Only the attestor can submit this storage challenge`] })
  // attestor finished job, add them to idleAttestors again
  const attestorID = storageChallenge.attestor
  if (!DB.idleAttestors.includes(attestorID)) giveAttestorNewJob(attestorID, log)
  // @TODO validate proof
  const isValid = validateProof(proofs, storageChallenge)
  let proofValidation
  const data = [storageChallengeID]
  if (isValid) response = { event: { data, method: 'StorageChallengeConfirmed' } }
  else response = { event: { data: [storageChallengeID], method: 'StorageChallengeFailed' } }
  // emit events
  const event = [response]
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
  if (DB.idleAttestors.length >= 5) asignAttestorsAndEmitPerformanceChallenge(performanceChallenge, log)
  else DB.attestorJobs.push({ fnName: 'asignAttestorsAndEmitPerformanceChallenge', opts: performanceChallenge })
}

async function _submitPerformanceChallenge (user, { name, nonce }, status, args) {
  const log = connections[name].log

  const [ performanceChallengeID, report ] = args
  log({ type: 'chain', body: [`Performance Challenge proof by attestor: ${user.id} for challenge: ${performanceChallengeID}`] })
  const performanceChallenge = DB.performanceChallenges[performanceChallengeID - 1]
  if (!performanceChallenge.attestors.includes(user.id)) return log({ type: 'chain', body: [`Only selected attestors can submit this performance challenge`] })
  // attestor finished job, add them to idleAttestors again
  const attestorID = user.id
  if (!DB.idleAttestors.includes(attestorID)) giveAttestorNewJob(attestorID, log)
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
    const feed = feeds[i]
    // split ranges to sets (size = setSize)
    const sets = makeSets({ ranges: feed.ranges, setSize })
    sets.forEach(set => {
      const contract = { plan: plan.id, feed: feed.id, ranges: set }
      const contractID = DB.contracts.push(contract)
      contract.id = contractID
      DB.draftContracts.push(contractID)
      log({ type: 'chain', body: [`New Draft Contract: ${JSON.stringify(contract)}`] })
    })
  }
}

async function activateContracts (log) {
  for (var start = new Date(); DB.draftContracts.length && new Date() - start < 4000;) {
    // remove contract from draftContracts
    const contractID = DB.draftContracts.shift()
    const contract = getContractByID(contractID)
    const size = setSize*64 //assuming each chunk is 64kb
    const plan = getPlanByID(contract.plan)
    const providers = getProviders({ plan }, log)
    if (!providers) {
      DB.draftContracts.unshift(contractID)
      return log({ type: 'chain', body: [`not enough providers available for this feed`] })
    }
    contract.providers = providers
    contract.activeHosters = []
    // emit event
    const NewContract = { event: { data: [contractID], method: 'NewContract' } }
    const event = [NewContract]
    handlers.forEach(([name, handler]) => handler(event))
    log({ type: 'chain', body: [`New Contract: ${JSON.stringify(contract)}`] })
    // add contract to the plan
    plan.contracts.push(contractID)

    const followUpAction = () => {
      const contract = getContractByID(contractID)
      const allHosters = []
      plan.contracts.forEach(contractID => {
          const contract = getContractByID(contractID)
          allHosters.push(...contract.activeHosters)
      })
      if (allHosters.length < 3) {
        log({ type: 'chain', body: [`Making additional contract since we do not have enough hosters`] })
        // @TODO dropHosting (notify the failed hoster(s) that they are out so we don't have zombie hosters)
        // INSTEAD OF ADDITIONAL CONTRACT rather select new hosters and if activeHosters than they send encoded to attestor
        // example, if you need 1 hoster => 2 activeHosters + new encoder, 1 attestor
        findAdditionalProviders(contractID, log)
        giveAttestorNewJob(attestor, log)
      }
    }
    const schedule = await scheduleAction
    schedule({ action: followUpAction, delay: 5 })
  }
}

function findAdditionalProviders (contractID, log) {
  const contract = getContractByID(contractID)
  const { ranges: set, plan: planID, feed: feedID } = contract
  const plan = getPlanByID(planID)
  const feed = getFeedByID(feedID)
  const size = setSize*64 //assuming each chunk is 64kb
  const providers = getProviders({ plan }, log)
  if (!providers) return log({ type: 'chain', body: [`not enough providers available for this feed`] })
  activateContracts({ feed, planID, providers, set }, log)
}

function getProviders ({ plan }, log) {
  if (DB.idleEncoders.length < 3) return log({ type: 'chain', body: [`missing encoders`] })
  if (DB.idleHosters.length < 3) return log({ type: 'chain', body: [`missing hosters`] })
  if (!DB.idleAttestors.length) return log({ type: 'chain', body: [`missing attestors`] })
  const size = setSize*64 //assuming each chunk is 64kb
  const avoid = {}
  avoid[plan.sponsor] = true // avoid[3] = true
  plan.feeds.forEach(feedObj => {
    const feed = getFeedByID(feedObj.id)
    avoid[feed.publisher] = true
  })
  // get 3 encoders
  const encoderAmount = 3
  const hosterAmount = 3
  const attestorAmount = 1

  const encoderOpts = { idleProviders: DB.idleEncoders, amount: encoderAmount, doesQualify: doesEncoderQualifyForAJob, avoid, plan, log }
  const encoders = select(encoderOpts)
  if (!encoders.length === encoderAmount) return log({ type: 'chain', body: [`insuffucient matching encoders`] })
  // get 3 hosters
  const hosterOpts = { size, idleProviders: DB.idleHosters, amount: hosterAmount, doesQualify: doesHosterQualifyForAJob, avoid, plan, log }
  const hosters = select(hosterOpts)
  if (!hosters.length === hosterAmount) {
    revertEncoders({ encoders, log })
    return log({ type: 'chain', body: [`insuffucient matching hosters`] })
  }
  reduceIdleStorage(hosters, size)
  // get 1 attestor
  const attestorOpts = { idleProviders: DB.idleAttestors, amount: attestorAmount, doesQualify: doesAttestorQualifyForAJob, avoid, plan, log }
  const [attestor] = select(attestorOpts)
  if (!attestor) {
    revertEncoders({ encoders, log })
    revertHosters({ hosters, size })
    return log({ type: 'chain', body: [`insuffucient matching attestors`] })
  }
  return { encoders, hosters, attestor }
}
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

function select ({ size, idleProviders, amount, doesQualify, avoid, plan, log }) {
  const { from, until, importance, config, schedules } =  plan
  idleProviders.sort(() => Math.random() - 0.5) // TODO: improve randomness
  // @TODO check for each provider if (provider.form.until is undefined or date is tomorrow)
  // if (encoder.form.from... && encoder.form.until...) ... => make this a function isAvailable()
  const selectedProviders = []
  const indexes = []
  for (var i = 0; i < idleProviders.length; i++) {
    const providerID = idleProviders[i]
    if (avoid[providerID]) continue // if providerID is in avoid, don't select it
    const provider = getUserByID(providerID)
    if (doesQualify({ size, plan, provider })) {
      selectedProviders.push(providerID)
      avoid[providerID] = true
      indexes.push(i)
      if (indexes.length === amount) {
        indexes.forEach(index => { idleProviders.splice(index, 1) })
        break
      }
    }
  }
  return selectedProviders
}

function doesEncoderQualifyForAJob ({ plan, provider }) {
  const form = provider.encoderForm
  const { from, until, importance, config, schedules } =  plan
  if (isAvailableFromUntil({ from, until, form })) return true
}
function doesHosterQualifyForAJob ({ size, plan, provider }) {
  const hoster = provider
  const form = provider.hosterForm
  const { from, until, importance, config, schedules } =  plan
  if ((size <= hoster.hosterForm.idleStorage) && (isAvailableFromUntil({ from, until, form }))) {
    return true
  }
}
function doesAttestorQualifyForAJob ({ plan, provider }) {
  const form = provider.attestorForm
  const { from, until, importance, config, schedules } =  plan
  if (isAvailableFromUntil({ from, until, form })) {
    return true
  }
}

function isAvailableFromUntil ({ from, until, form: providerForm }) {
  const providerFrom = Date.parse(providerForm.from)
  const providerUntil = Date.parse(providerForm.until)
  const planFrom = Date.parse(from)
  const planUntil = Date.parse(until.time)
  const timeNow = new Date()

  if ((planFrom < timeNow || providerFrom <= planFrom) && (providerForm.until === '' || providerUntil >= planUntil)) {
    return true
  }
}
function reduceIdleStorage (hosters, size) {
  hosters.forEach(hosterID => {
    const hoster = getUserByID(hosterID)
    hoster.hosterForm.idleStorage -= size
  })
}
function giveAttestorNewJob (attestorID, log) {
  DB.idleAttestors.push(attestorID)
  if (DB.attestorJobs.length) {
    const next = DB.attestorJobs[0]
    if (next.fnName === 'asignAttestorsAndEmitPerformanceChallenge' && DB.idleAttestors.length >= 5) {
      DB.attestorJobs.shift()
      asignAttestorsAndEmitPerformanceChallenge(next.opts, log)
    }
    if (next.fnName === 'assignAttestorAndEmitStorageChallenge' && DB.idleAttestors.length >= 1) {
      DB.attestorJobs.shift()
      assignAttestorAndEmitStorageChallenge(next.opts, log)
    }
  }
}
function revertEncoders ({ encoders, log }) {
  encoders.forEach(encoderID => {
    DB.idleEncoders.unshift(encoderID)
  })
}
function revertHosters ({ hosters, size }) {
  hosters.forEach(hosterID => {
    DB.idleHosters.unshift(hosterID)
    const hoster = getUserByID(hosterID)
    hoster.hosterForm.idleStorage += size
  })
}
function asignAttestorsAndEmitPerformanceChallenge (performanceChallenge, log) {
  // select 5 attestors
  performanceChallenge.attestors = DB.idleAttestors.splice(0, 5)
  const performanceChallengeID = performanceChallenge.id
  log({ type: 'chain', body: [`Requesting new PerformanceChallenge: ${performanceChallengeID}`] })
  const challenge = { event: { data: [performanceChallengeID], method: 'NewPerformanceChallenge' } }
  const event = [challenge]
  handlers.forEach(([name, handler]) => handler(event))
  log({ type: 'chain', body: [`emit chain event ${JSON.stringify(event)}`] })
}
function assignAttestorAndEmitStorageChallenge ({ attestorID, storageChallenge, log }) {
  const storageChallengeID = storageChallenge.id
  storageChallenge.attestor = attestorID
  log({ type: 'chain', body: [`Requesting new StorageChallenge: ${storageChallengeID}`] })
  storageChallenge.attestor = attestorID
  // emit events
  const challenge = { event: { data: [storageChallengeID], method: 'NewStorageChallenge' } }
  const event = [challenge]
  handlers.forEach(([name, handler]) => handler(event))
  log({ type: 'chain', body: [`emit chain event ${JSON.stringify(event)}`] })
}
function getAttestorForChallenge (storageChallenge, log) {
  const hosterID = storageChallenge.hoster
  log({ type: 'chain', body: [`getting attestor ${ DB.idleAttestors}`] })
  for (var i = 0; i < DB.idleAttestors.length; i++) {
    if (DB.idleAttestors[i]!== hosterID) return DB.idleAttestors.splice(i, 1)
  }
  log({ type: 'chain', body: [`no unique attestors available for storage challenge`] })
  return []
}
