const WebSocket = require('ws')

const handlers = []
const chainserver = { requests: [] }

module.exports = {
  create: async ({ name, provider }) => {
    if (typeof provider !== 'string') throw new Error('no fake chain')
    const api = ({
      query: {
        system: { events: handler => handlers.push(handler) },
        datVerify: {
          getUserByID: getUserByID.bind(name),
          getFeedByID: getFeedByID.bind(name),
          getFeedByKey: getFeedByKey.bind(name),
          getPlanByID: getPlanByID.bind(name),
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
        encodingDone: encodingDone.bind(name),
        hostingStarts: hostingStarts.bind(name),
        requestStorageChallenge: requestStorageChallenge.bind(name),
        requestPerformanceChallenge: requestPerformanceChallenge.bind(name),
        submitStorageChallenge: submitStorageChallenge.bind(name),
        submitPerformanceChallenge: submitPerformanceChallenge.bind(name)
        }
      }
    })
    return new Promise(connectNode)
    function connectNode (resolve, reject) {
      if (chainserver[name]) return resolve(api)
      var ws = new WebSocket(provider)
      ws.on('open', function open () {
        chainserver[name] = { name, counter: 0, ws, requests: [] }
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
        if (!cite) return handlers.forEach(handle => handle(body))
        const [name, msgid] = cite[0]
        const resolve = chainserver[name].requests[msgid]
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
async function encodingDone (...args) { return { signAndSend: signAndSend.bind({ name: this, args, type: 'encodingDone'}) } }
async function hostingStarts (...args) { return { signAndSend: signAndSend.bind({ name: this, args, type: 'hostingStarts'}) } }
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
    const msgid = chainserver[name].counter++
    const flow = [chainserver[name].name, msgid]
    chainserver[name].requests[msgid] = resolve
    chainserver[name].ws.send(JSON.stringify({ flow, type: 'getFeedByID', body: id }))
  })
}
function getFeedByKey (key) {
  const name = this
  return new Promise(resolve => {
    const msgid = chainserver[name].counter++
    const flow = [chainserver[name].name, msgid]
    chainserver[name].requests[msgid] = resolve
    chainserver[name].ws.send(JSON.stringify({ flow, type: 'getFeedByKey', body: key }))
  })
}
function getUserByID (id) {
  const name = this
  return new Promise(resolve => {
    const msgid = chainserver[name].counter++
    const flow = [chainserver[name].name, msgid]
    chainserver[name].requests[msgid] = resolve
    chainserver[name].ws.send(JSON.stringify({ flow, type: 'getUserByID', body: id }))
  })
}
function getPlanByID (id) {
  const name = this
  return new Promise(resolve => {
    const msgid = chainserver[name].counter++
    const flow = [chainserver[name].name, msgid]
    chainserver[name].requests[msgid] = resolve
    chainserver[name].ws.send(JSON.stringify({ flow, type: 'getPlanByID', body: id }))
  })
}
function getContractByID (id) {
  const name = this
  return new Promise(resolve => {
    const msgid = chainserver[name].counter++
    const flow = [chainserver[name].name, msgid]
    chainserver[name].requests[msgid] = resolve
    chainserver[name].ws.send(JSON.stringify({ flow, type: 'getContractByID', body: id }))
  })
}
function getStorageChallengeByID (id) {
  const name = this
  return new Promise(resolve => {
    const msgid = chainserver[name].counter++
    const flow = [chainserver[name].name, msgid]
    chainserver[name].requests[msgid] = resolve
    chainserver[name].ws.send(JSON.stringify({ flow, type: 'getStorageChallengeByID', body: id }))
  })
}
function getPerformanceChallengeByID (id) {
  const name = this
  return new Promise(resolve => {
    const msgid = chainserver[name].counter++
    const flow = [chainserver[name].name, msgid]
    chainserver[name].requests[msgid] = resolve
    chainserver[name].ws.send(JSON.stringify({ flow, type: 'getPerformanceChallengeByID', body: id }))
  })
}

/******************************************************************************
  ROUTING (sign & send)
******************************************************************************/
function signAndSend (signer, { nonce }, status) {
  const { name, type, args } = this
  status({ events: [], status: { isInBlock:1 } })
  const msgid = chainserver[name].counter++
  const flow = [chainserver[name].name, msgid]
  chainserver[name].requests[msgid] = status
  const address = signer.address
  const message = { flow, type, body: {type, args, nonce, address } }
  chainserver[name].ws.send(JSON.stringify(message))
}
