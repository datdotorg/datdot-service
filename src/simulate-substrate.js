const feeds = {}
const feedlist = []
const accounts = {}
const handlers = []
const ROLES = { all: [], seeders: [], attestors: [], encoders: [] }

module.exports = {
  create: () => ({
    query: {
      system: { events: handler => handlers.push(handler) },
      datVerify: { dat, users }
    },
    tx: { datVerify: { registerEncoder, registerAttestor, registerHoster, registerData } }
  })
}

async function registerEncoder () { return { signAndSend: signAndSend.bind('registerEncoder') } }
async function registerAttestor () { return { signAndSend: signAndSend.bind('registerAttestor') } }
async function registerHoster () { return { signAndSend: signAndSend.bind('registerHoster') } }
async function registerData (merkleRoot) {
  const [key, {hashType, children}, signature] = merkleRoot
  const feed = { publickey: key, meta: { signature, hashType, children }, status: 'unhosted' }
  feeds[key] = feed
  const id = feedlist.push(feed) - 1
  feed.id = id
  return { signAndSend: signAndSend.bind('registerData') }
}
function dat (id) {
  const feed = feedlist[id]
  return { archive_pubkey: feed.publickey }
}
function users (id) {
  const account =  ROLES.all[id]
  const { address } = account
  return { address}
}
async function signAndSend (account, { nonce }, status) {
  const fn_name = `${this}`
  const ACCOUNT = loadAccount(account)
  if (!ACCOUNT) return console.error('NO ACCOUNT', ACCOUNT)
  status({ events: [], status: {isInBlock:1} })
  const { name, address } = ACCOUNT
  if (fn_name === 'registerData') {
    const SomethingStored = { event: { data: [address], method: 'SomethingStored' } }
    handlers.forEach(handler => handler([SomethingStored]))
  }
  else if (fn_name === 'registerHoster') {

    ROLES.seeders.push(ACCOUNT)
    const id = ROLES.all.push(ACCOUNT) - 1
    ACCOUNT.id = id
    const unhosted = feedlist.filter(feed => feed.status === 'unhosted')
    const feed = getRandom(unhosted)
    if (!feed) return console.log('current lack of demand for hosting feeds')
    const encoder = getRandom(ROLES.encoders)
    if (!encoder) return console.log('missing encoder')
    const NewPin = { event: { data: [encoder.id, ACCOUNT.id, feed.id], method: 'NewPin' } }
    handlers.forEach(handler => handler([NewPin]))
  }
  else if (fn_name === 'registerEncoder') {
    ROLES.encoders.push(ACCOUNT)
    const id = ROLES.all.push(ACCOUNT) - 1
    ACCOUNT.id = id
  }
  else if (fn_name === 'registerAttestor') {
    ROLES.attestors.push(ACCOUNT)
    const id = ROLES.all.push(ACCOUNT) - 1
    ACCOUNT.id = id
  }
}
// ---------------------------------------------------------------
// HELPER
// ---------------------------------------------------------------
function loadAccount (account) {
  const address = account.address
  if (accounts[address]) return accounts[address]
  return accounts[address] = account
}
function getRandom (items) {
  if (!items.length) return
  return items[Math.floor(Math.random() * items.length)]
}
