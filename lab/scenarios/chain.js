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
  // Add planID to unhostedPlans
  DB.unhostedPlans.push(planID)
  // Add feeds to unhosted
  plan.unhostedFeeds = feeds

  // @TODO schedule for plan.from 
  // => then in callback execute Db.unhostedPlans.push(planID) && tryContract
  // Find hosters,encoders and attestors
  tryContract({ plan, log })

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
  tryContract({ log })
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
  tryContract({ log })
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
  tryContract({ log })
}

async function unpublishPlan (user, { name, nonce }, status, args) {
  const [planID] = args
  const plan = getPlanByID(planID)
  if (!plan.sponsor === user.id) return log({ type: 'chain', body: [`Only a sponsor is allowed o unpublish the plan`] })
  // what happens when we unpublishPlan? do we pause it?
  // what happens to providers working on it (hosters, attestors in current challenges...?)
}
async function unregisterHoster (user, { name, nonce }, status) {
  if (user.hosterKey && user.hosterForm) {
    user.hosterKey = void 0
    user.hosterForm = void 0
    // remove from idlehosters
    // @TODO if hoster was hosting anything && same set of ranges is hosted by less than 3 hosters, then makeAdditionalContract()
  }
}
async function unregisterEncoder (user, { name, nonce }, status) {
  if (user.encoderKey && user.encoderForm) {
    user.encoderKey = void 0
    user.encoderForm = void 0
  }
}
async function unregisterAttestor (user, { name, nonce }, status) {
  if (user.attestorKey && user.attestorForm) {
    user.attestorKey = void 0
    user.attestorForm = void 0
  }
}

async function _hostingStarts (user, { name, nonce }, status, args) {
  const log = connections[name].log
  const [ contractID ] = args
  const userID = user.id
  const contract = DB.contracts[contractID - 1]
  const plan = getPlanByID(contract.plan)
  const hosters = contract.hosters
  if (!hosters.includes(userID)) return log({ type: 'chain', body: [`Error: this user can not call this function`] })
  const activeHosters = contract.activeHosters
  if (!activeHosters.includes(userID)) activeHosters.push(userID)
  // for each hostingStarts we pay attestor(1/3), this hoster (full), encoders (full, but just once)
  // encoders finished their job, make them idle again
  const encoders = contract.encoders
  for (var i = 0; i < encoders.length; i++) {
    if (!DB.idleEncoders.includes(encoders[i])) DB.idleEncoders.push(encoders[i])
  }
  if (activeHosters.length === hosters.length) {
    // atestor finished their job, make them idle again
    const attestorID = contract.attestor
    if (!DB.idleAttestors.includes(attestorID)) giveAttestorNewJob(attestorID, log)
  }
  const confirmation = { event: { data: [contractID, userID], method: 'HostingStarted' } }
  const event = [confirmation]
  handlers.forEach(([name, handler]) => handler(event))
  // log({ type: 'chain', body: [`emit chain event ${JSON.stringify(event)}`] })
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
  if (DB.idleAttestors.length) assignAttestorAndEmitStorageChallenge(storageChallenge, log)
  else DB.attestorJobs.push({ fnName: 'assignAttestorAndEmitStorageChallenge', opts: storageChallenge })
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
function tryContract ({ plan, log }) {
  // @TODO try to make contract for when the plan needs to be hosted (plan.from)
  log({ type: 'chain', body: [`Trying new contract`] })

  // get a plan
  const unhostedPlans = DB.unhostedPlans
  var selectedPlan
  if (plan) selectedPlan = plan
  else if (!plan && unhostedPlans.length) selectedPlan = findPlan({ plan, unhostedPlans, log })
  if (!selectedPlan) return log({ type: 'chain', body: [`current lack of demand for hosting plans`] })
  const planID = selectedPlan.id

  // For each feed

  const unhostedFeeds = selectedPlan.unhostedFeeds
  console.log('unhostedFeeds', unhostedFeeds)
  const readyForContract = []
  const unhostedFeedsCount = unhostedFeeds.length
  for (var i = 0; i < unhostedFeeds.length; i++) {
    const feed = unhostedFeeds[i]

    // remove feed from unhostedFeeds
    unhostedFeeds.shift()
    // If this was last unhosted feed in the plan, we can remove plan ID from unhostedPlans
    if (!unhostedFeeds.length) removePlanFromUnhosted(planID, unhostedPlans)

    // split ranges to sets (size = setSize)
    const setSize = 10 // every contract is for hosting 10 chunks
    const sets = makeSets({ ranges: feed.ranges, setSize })
    // get providers
    const allArgs = []
    sets.forEach(set => {
      const size = set.length*64 //assuming each chunk is 64kb
      const providers = getProviders({ size, selectedPlan, feed, log })
      if (!providers) return log({ type: 'chain', body: [`not enough providers available for this feed`] })
      const { encoders, hosters, attestor } = providers
      const args = { feed, planID, encoders, hosters, attestor, set }
      allArgs.push({ args, log })
    })
    if (allArgs.length === sets.length) readyForContract.push(allArgs)
  }

  if (readyForContract.length !== unhostedFeedsCount) return log({ type: 'chain', body: [`not enough providers available for all the feeds in this plan`] })
  readyForContract.flat().forEach(({ args, log }) => makeContract ({ args, log }) )



  // make contracts
}
async function makeContract ({ args, log }) {
  const { feed, planID, encoders, hosters, attestor, set } = args
  const contract = {
    plan: planID,
    feed: feed.id,
    ranges: set, // subset of all ranges from the plan (size = setSize)
    encoders,
    hosters, // [1,5,9, 7]
    attestor,
    activeHosters: [], // [1,9]
    // @TODO make more defined: add until, config etc.
  }
  const contractID = DB.contracts.push(contract)
  contract.id = contractID

  log({ type: 'chain', body: [`New Contract: ${JSON.stringify(contract)}`] })
  const contractFollowUp = () => {
    const contract = getContractByID(contractID)
    console.log('Contracts active length', contract.activeHosters.length)
    if (contract.activeHosters.length < 3) {
      console.log('Making additional contract since we do not have enough hosters')
      // find more hosters => make newContract again, don't drop existing hostings
      // @TODO notify the failed hoster(s) that they are out so we don't have zombie hosters
      // INSTEAD OF ADDITIONAL CONTRACT rather select new hosters and if activeHosters than they send encoded to attestor
      makeAdditionalContract(contractID, log)
      // attestor is not needed anymore, set them to idle again
      giveAttestorNewJob(attestor, log)
    }
  }
  const schedule = await scheduleAction
  schedule({ action: contractFollowUp, delay: 5 })
  const NewContract = { event: { data: [contractID], method: 'NewContract' } }
  const event = [NewContract]
  handlers.forEach(([name, handler]) => handler(event))
}
function makeAdditionalContract (contractID, log) {
  if (DB.idleEncoders.length < 3) return log({ type: 'chain', body: [`missing encoders`] })
  if (DB.idleHosters.length < 3) return log({ type: 'chain', body: [`missing hosters`] })
  if (!DB.idleAttestors.length) return log({ type: 'chain', body: [`missing attestors`] })

  const contract = getContractByID(contractID)
  const { ranges: set, plan: planID, feed: feedID } = contract
  const plan = getPlanByID(planID)
  const feed = getFeedByID(feedID)
  const size = set.length*64 //assuming each chunk is 64kb
  const providers = getProviders({ size, selectedPlan: plan, feed, log })
  if (!providers) return
  const { encoders, hosters, attestor } = providers

  const args = { feed, planID, encoders, hosters, attestor, set }
  makeContract ({ args, log })
}
function getProviders ({ size, selectedPlan: plan, feed, log }) {
  // 3 encoders, 3 hosters, 1 attestor
  const unhostedPlans = DB.unhostedPlans
  const { unhostedFeeds, id: planID } =  plan
  if (DB.idleEncoders.length < 3) return log({ type: 'chain', body: [`missing encoders`] })
  if (DB.idleHosters.length < 3) return log({ type: 'chain', body: [`missing hosters`] })
  if (!DB.idleAttestors.length) return log({ type: 'chain', body: [`missing attestors`] })

  // @TODO select more detailed based on providers' settings (storage space, availability etc.)
  const encoders = selectEncoders({ plan, log })
  if (!encoders.length) {
    revertPlanAndFeed ({ planID, feed, unhostedPlans, unhostedFeeds })
    return log({ type: 'chain', body: [`no matching encoders`] })
  }

  const hosters = selectHosters({ encoders, size, plan, log} )
  if (!hosters.length) {
    revertPlanAndFeed({ planID, feed, unhostedPlans, unhostedFeeds })
    revertEncoders({ encoders, feed, planID, log })
    return log({ type: 'chain', body: [`no matching hosters`] })
  }

  const attestor = selectAttestor({ encoders, hosters, plan, log })
  if (!attestor) {
    revertPlanAndFeed({ planID, feed, unhostedPlans, unhostedFeeds })
    revertEncoders({ encoders, feed, planID, log })
    revertHosters({ hosters, size })
    return log({ type: 'chain', body: [`no matching attestor`] })
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
function findPlan ({ unhostedPlans, log }) {
  var [planID] = getRandom(unhostedPlans)
  return DB.plans[planID - 1]
}
function selectEncoders ({ plan, log }) {
  const idleEncoders = DB.idleEncoders
  idleEncoders.sort(() => Math.random() - 0.5)
  const encoders = []
  for (var i = 0; i < idleEncoders.length; i++) {
    var indexes = []
    const encoderID = idleEncoders[i]
    const encoder = getUserByID(encoderID)
    const checkOpts = { plan, form: encoder.encoderForm }
    if (doesEncoderQualifyForAJob(checkOpts)) {
      encoders.push(encoderID)
      indexes.push(i)
      if (indexes.length === 3) {
        indexes.forEach(index => { idleEncoders.splice(index, 1) })
        break
      }
    }
  }
  // @TODO check for each encoder if (encoder.form.until is undefined or date is tomorrow)
  // if (encoder.form.from... && encoder.form.until...) ... => make this a function isAvailable()
  return idleEncoders.splice(0,3)
}
function selectHosters ({ encoders, size, plan, log }) {
  const idleHosters = DB.idleHosters
  const { from, until, importance, config, schedules } =  plan
  idleHosters.sort(() => Math.random() - 0.5)
  var selectedHosters = []
  var indexes = []
  for (var i = 0; i < idleHosters.length; i++) {
    const hosterID = idleHosters[i]
    const hoster = getUserByID(hosterID)
    const checkOpts = { encoders, hosterID, size, hoster, plan, form: hoster.hosterForm }
    if (doesHosterQualifyForAJob(checkOpts)) {
      selectedHosters.push(hosterID)
      indexes.push(i)
      if (indexes.length === 3) {
        indexes.forEach(index => { idleHosters.splice(index, 1) })
        break
      }
    }
  }
  return selectedHosters
  reduceIdleStorage(selectedHosters, size)
}
function selectAttestor ({ encoders, hosters, plan, log }) {
  const idleAttestors = DB.idleAttestors
  const { from, until, importance, config, schedules } =  plan
  idleAttestors.sort(() => Math.random() - 0.5)
  // @TODO check for each attestor if (attestor.form.until is undefined or date is tomorrow)
  var selectedAttestor
  for (var i = 0; i < idleAttestors.length; i++) {
    const attestorID = idleAttestors[i]
    const attestor = getUserByID(attestorID)
    const checkOpts = { encoders, hosters, attestorID, plan, form: attestor.attestorForm }
    if (doesAttestorQualifyForAJob(checkOpts)) {
      selectedAttestor = attestorID
      idleAttestors.splice(i, 1)
      break
    }
  }
  return selectedAttestor
}
function doesEncoderQualifyForAJob ({ plan, form }) {
  const { from, until, importance, config, schedules } =  plan
  if (isAvailableFromUntil({ from, until, form })) return true
}
function doesHosterQualifyForAJob (checkOpts) {
  const { encoders, hosterID, size, hoster, plan, form } = checkOpts
  const { from, until, importance, config, schedules } =  plan
  if (!encoders.includes(hosterID) && (size <= hoster.hosterForm.idleStorage) && (isAvailableFromUntil({ from, until, form }))) {
    return true
  }
}
function doesAttestorQualifyForAJob (checkOpts) {
  const { encoders, hosters, attestorID, plan, form } = checkOpts
  const { from, until, importance, config, schedules } =  plan
  if (!encoders.includes(attestorID) && !hosters.includes(attestorID) && (isAvailableFromUntil({ from, until, form }))) {
    return true
  }
}
function isAvailableFromUntil ({ from, until, form: providerForm }) {
  if (from && (providerForm.from <= from) && until && (providerForm.until === '' || providerForm.until >= until)) {
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
function removePlanFromUnhosted (planID, unhostedPlans) {
  for (var i = 0; i < unhostedPlans.length; i++) {
    if (unhostedPlans[i] === planID) unhostedPlans.splice(i, 1)
  }
}
function revertPlanAndFeed ({ planID, feed, unhostedPlans, unhostedFeeds }) {
  unhostedPlans.unshift(planID)
  unhostedFeeds.unshift(feed)
}
function revertEncoders ({ encoders, feed, planID, log }) {
  // if no hosters available, revert everything
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
function assignAttestorAndEmitStorageChallenge (storageChallenge, log) {
  const [attestorID] = getAttestor(storageChallenge, log)
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
function getAttestor (storageChallenge, log) {
  const hosterID = storageChallenge.hoster
  log({ type: 'chain', body: [`getting attestor ${ DB.idleAttestors}`] })
  for (var i = 0; i < DB.idleAttestors.length; i++) {
    if (DB.idleAttestors[i]!== hosterID) return DB.idleAttestors.splice(i, 1)
  }
}
