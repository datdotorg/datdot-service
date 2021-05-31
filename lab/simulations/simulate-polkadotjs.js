const WebSocket = require('ws')

const handlers = []
const requests = []
const blockSubscribers = []
var instance = void 0

module.exports = {
  create: async ({ name, provider }) => {
    if (typeof provider !== 'string') throw new Error('provider is not a fake chain')
    var header = { number: 0 }
    const api = ({
      query: {
        system: { events: handler => handlers.push(handler) },
        datVerify: {
          getItemByID: getItemByID.bind(name),
          getUserByID: getUserByID.bind(name),
          getUserIDByNoiseKey: getUserIDByNoiseKey.bind(name),
          getUserIDBySigningKey: getUserIDBySigningKey.bind(name),
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
        registerForWork: registerForWork.bind(name),
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
      },
      derive: {
        chain: { getHeader: () => header }
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
        const { cite, type, data } = JSON.parse(message)
        if (type === 'block') {
          header = data
          return blockSubscribers.forEach(handle => handle(data))
        }
        if (!cite) return handlers.forEach(handle => handle(data))
        const [name, msgid] = cite[0]
        const resolve = requests[msgid]
        resolve(data)
      })
    }
  }
}
/******************************************************************************
  TRANSACTIONS (=EXTRINSICS)
******************************************************************************/
async function newUser (...args) { return { signAndSend: signAndSend.bind({ name: this, args, type: 'newUser' }) } }
async function registerForWork (...args) { return { signAndSend: signAndSend.bind({ name: this, args, type: 'registerForWork' }) } }
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
function getItemByID (id) {
  const name = this
  return new Promise(resolve => {
    const msgid = instance.counter++
    const flow = [instance.name, msgid]
    requests[msgid] = resolve
    instance.ws.send(JSON.stringify({ flow, type: 'getItemByID', data: id }))
  })
}
function getFeedByID (id) {
  const name = this
  return new Promise(resolve => {
    const msgid = instance.counter++
    const flow = [instance.name, msgid]
    requests[msgid] = resolve
    instance.ws.send(JSON.stringify({ flow, type: 'getFeedByID', data: id }))
  })
}
function getFeedByKey (key) {
  const name = this
  return new Promise(resolve => {
    const msgid = instance.counter++
    const flow = [instance.name, msgid]
    requests[msgid] = resolve
    instance.ws.send(JSON.stringify({ flow, type: 'getFeedByKey', data: key }))
  })
}
function getUserByID (id) {
  const name = this
  return new Promise(resolve => {
    const msgid = instance.counter++
    const flow = [instance.name, msgid]
    requests[msgid] = resolve
    instance.ws.send(JSON.stringify({ flow, type: 'getUserByID', data: id }))
  })
}
function getUserIDByNoiseKey (key) {
  const name = this
  return new Promise(resolve => {
    const msgid = instance.counter++
    const flow = [instance.name, msgid]
    requests[msgid] = resolve
    instance.ws.send(JSON.stringify({ flow, type: 'getUserIDByNoiseKey', data: key }))
  })
}
function getUserIDBySigningKey (key) {
  const name = this
  return new Promise(resolve => {
    const msgid = instance.counter++
    const flow = [instance.name, msgid]
    requests[msgid] = resolve
    instance.ws.send(JSON.stringify({ flow, type: 'getUserIDBySigningKey', data: key }))
  })
}
function getPlanByID (id) {
  const name = this
  return new Promise(resolve => {
    const msgid = instance.counter++
    const flow = [instance.name, msgid]
    requests[msgid] = resolve
    instance.ws.send(JSON.stringify({ flow, type: 'getPlanByID', data: id }))
  })
}
function getAmendmentByID (id) {
  const name = this
  return new Promise(resolve => {
    const msgid = instance.counter++
    const flow = [instance.name, msgid]
    requests[msgid] = resolve
    instance.ws.send(JSON.stringify({ flow, type: 'getAmendmentByID', data: id }))
  })
}
function getContractByID (id) {
  const name = this
  return new Promise(resolve => {
    const msgid = instance.counter++
    const flow = [instance.name, msgid]
    requests[msgid] = resolve
    instance.ws.send(JSON.stringify({ flow, type: 'getContractByID', data: id }))
  })
}
function getStorageChallengeByID (id) {
  const name = this
  return new Promise(resolve => {
    const msgid = instance.counter++
    const flow = [instance.name, msgid]
    requests[msgid] = resolve
    instance.ws.send(JSON.stringify({ flow, type: 'getStorageChallengeByID', data: id }))
  })
}
function getPerformanceChallengeByID (id) {
  const name = this
  return new Promise(resolve => {
    const msgid = instance.counter++
    const flow = [instance.name, msgid]
    requests[msgid] = resolve
    instance.ws.send(JSON.stringify({ flow, type: 'getPerformanceChallengeByID', data: id }))
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
  const message = { flow, type, data: {type, args, nonce, address } }
  instance.ws.send(JSON.stringify(message))
}
