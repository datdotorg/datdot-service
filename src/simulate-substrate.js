const WebSocket = require('ws')

const handlers = []
const requests = []
const blockSubscribers = []
var instance = void 0

module.exports = {
  create: async ({ name, provider }) => {
    if (typeof provider !== 'string') throw new Error('provider is not a fake chain')
    const header = { number: 0 }
    const api = ({
      query: {
        system: { events: handler => handlers.push(handler) },
        datVerify: {
          getUserByID: getUserByID.bind(name),
          getUserIDByKey: getUserIDByKey.bind(name),
          getFeedByID: getFeedByID.bind(name),
          getFeedByKey: getFeedByKey.bind(name),
          getPlanByID: getPlanByID.bind(name),
          getAmendmentByID: getAmendmentByID.bind(name),
          getContractByID: getContractByID.bind(name),
          getStorageChallengeByID: getStorageChallengeByID.bind(name),
          getPerformanceChallengeByID: getPerformanceChallengeByID.bind(name),
        }
      },
      createType: (nonce) => nonce,
      tx: { datVerify: {
        newUser: newUser.bind(name),
        registerEncoder: registerEncoder.bind(name),
        registerAttestor: registerAttestor.bind(name),
        registerHoster: registerHoster.bind(name),
        publishFeed: publishFeed.bind(name),
        publishPlan: publishPlan.bind(name),
        amendmentReport: amendmentReport.bind(name),
        requestStorageChallenge: requestStorageChallenge.bind(name),
        requestPerformanceChallenge: requestPerformanceChallenge.bind(name),
        submitStorageChallenge: submitStorageChallenge.bind(name),
        submitPerformanceChallenge: submitPerformanceChallenge.bind(name)
        }
      },
      rpc: {
        chain: { subscribeNewHeads: handle => blockSubscribers.push(handle) }
      }
    })
    if (instance) throw new Error('only one fakechain API per process')
    instance = true
    return new Promise(connectNode)
    function connectNode (resolve, reject) {
      var ws = new WebSocket(provider)
      ws.on('open', function open () {
        instance = { name, counter: 0, ws, api }
        resolve(api)
      })
      ws.on('error', function error (err) {
        setTimeout(() => connectNode(resolve, reject), 2000)
      })
      ws.on('close', function close () {
        console.error('unexpected closing of chain connection for', name)
      })
      ws.on('message', function incoming (message) {
        const { cite, type, body } = JSON.parse(message)
        if (type === 'block') return blockSubscribers.forEach(handle => handle(body))
        if (!cite) return handlers.forEach(handle => handle(body))
        const [name, msgid] = cite[0]
        const resolve = requests[msgid]
        resolve(body)
      })
    }
  }
}
/******************************************************************************
  TRANSACTIONS (=EXTRINSICS)
******************************************************************************/
async function newUser (...args) { return { signAndSend: signAndSend.bind({ name: this, args, type: 'newUser' }) } }
async function registerEncoder (...args) { return { signAndSend: signAndSend.bind({ name: this, args, type: 'registerEncoder' }) } }
async function registerAttestor (...args) { return { signAndSend: signAndSend.bind({ name: this, args, type: 'registerAttestor' }) } }
async function registerHoster (...args) { return { signAndSend: signAndSend.bind({ name: this, args, type: 'registerHoster' }) } }
async function publishFeed (...args) { return { signAndSend: signAndSend.bind({ name: this, args, type: 'publishFeed'}) } }
async function publishPlan (...args) { return { signAndSend: signAndSend.bind({ name: this, args, type: 'publishPlan'}) } }
async function amendmentReport (...args) { return { signAndSend: signAndSend.bind({ name: this, args, type: 'amendmentReport'}) } }
async function requestStorageChallenge (...args) { return { signAndSend: signAndSend.bind({ name: this, args, type: 'requestStorageChallenge'}) } }
async function requestPerformanceChallenge (...args) { return { signAndSend: signAndSend.bind({ name: this, args, type: 'requestPerformanceChallenge'}) } }
async function submitStorageChallenge (...args) { return { signAndSend: signAndSend.bind({ name: this, args, type: 'submitStorageChallenge'}) } }
async function submitPerformanceChallenge (...args) { return { signAndSend: signAndSend.bind({ name: this, args, type: 'submitPerformanceChallenge'}) } }
/******************************************************************************
  QUERIES
******************************************************************************/
function getFeedByID (id) {
  const name = this
  return new Promise(resolve => {
    const msgid = instance.counter++
    const flow = [instance.name, msgid]
    requests[msgid] = resolve
    instance.ws.send(JSON.stringify({ flow, type: 'getFeedByID', body: id }))
  })
}
function getFeedByKey (key) {
  const name = this
  return new Promise(resolve => {
    const msgid = instance.counter++
    const flow = [instance.name, msgid]
    requests[msgid] = resolve
    instance.ws.send(JSON.stringify({ flow, type: 'getFeedByKey', body: key }))
  })
}
function getUserByID (id) {
  const name = this
  return new Promise(resolve => {
    const msgid = instance.counter++
    const flow = [instance.name, msgid]
    requests[msgid] = resolve
    instance.ws.send(JSON.stringify({ flow, type: 'getUserByID', body: id }))
  })
}
function getUserIDByKey (key) {
  const name = this
  return new Promise(resolve => {
    const msgid = instance.counter++
    const flow = [instance.name, msgid]
    requests[msgid] = resolve
    instance.ws.send(JSON.stringify({ flow, type: 'getUserIDByKey', body: key }))
  })
}
function getPlanByID (id) {
  const name = this
  return new Promise(resolve => {
    const msgid = instance.counter++
    const flow = [instance.name, msgid]
    requests[msgid] = resolve
    instance.ws.send(JSON.stringify({ flow, type: 'getPlanByID', body: id }))
  })
}
function getAmendmentByID (id) {
  const name = this
  return new Promise(resolve => {
    const msgid = instance.counter++
    const flow = [instance.name, msgid]
    requests[msgid] = resolve
    instance.ws.send(JSON.stringify({ flow, type: 'getAmendmentByID', body: id }))
  })
}
function getContractByID (id) {
  const name = this
  return new Promise(resolve => {
    const msgid = instance.counter++
    const flow = [instance.name, msgid]
    requests[msgid] = resolve
    instance.ws.send(JSON.stringify({ flow, type: 'getContractByID', body: id }))
  })
}
function getStorageChallengeByID (id) {
  const name = this
  return new Promise(resolve => {
    const msgid = instance.counter++
    const flow = [instance.name, msgid]
    requests[msgid] = resolve
    instance.ws.send(JSON.stringify({ flow, type: 'getStorageChallengeByID', body: id }))
  })
}
function getPerformanceChallengeByID (id) {
  const name = this
  return new Promise(resolve => {
    const msgid = instance.counter++
    const flow = [instance.name, msgid]
    requests[msgid] = resolve
    instance.ws.send(JSON.stringify({ flow, type: 'getPerformanceChallengeByID', body: id }))
  })
}

/******************************************************************************
  ROUTING (sign & send)
******************************************************************************/
function signAndSend (signer, { nonce }, status) {
  const { name, type, args } = this
  status({ events: [], status: { isInBlock:1 } })
  const msgid = instance.counter++
  const flow = [instance.name, msgid]
  requests[msgid] = status
  const address = signer.address
  const message = { flow, type, body: {type, args, nonce, address } }
  instance.ws.send(JSON.stringify(message))
}
