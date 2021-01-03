# Logic for RESUME + CANCEL feature

# SENDER without hypercore
```js
const { secretkey, publickey } = crypto.keypair()
const name = 'alice'
function sign (input) { // used by SENDER (=signer)
  const { body, secretkey } = input
  const json = JSON.stringify(body)
  const signature = crypto.sign(json, secretkey)
  return signature
}
const from = name
const id = 0
const type = 'register'
const data = publickey
const body = {
  flow: [from, id],
  type,
  data // publickey
}
const signature = sign({ body, secretkey })
const message = { signature, body }
send(message)
```

# SENDER with hypercore
```js
// SENDER
const feed = hypercore('alice')
swarm.join(feed.discoveryKey)
chain.register(feed.feedKey)
const message = { // first message
  type,
  data // publickey
}
feed.append(message)
// do more transactions by appending more messages
```

# RECEIVER
```js
const connections = {}
receiver.on(receive)
```

# RECEIVE without hypercore
```js
function receive (message) {
  const { signature, body } = message
  const { flow: [from, id], type, data } = body
  if (!type) throw new Error('missing type')
  const publickey = await load_user(from, id, data).catch(handleError)
  if (!publickey) return handleError()
  const verfied = verify({ body, signature, publickey })
  if (!verfied) throw new Error('invalid message')
  handleVerifiedUserMessage(body)
}
function verify (input) { // used by RECEIVER (=verifier)
  const { body, signature, publickey } = input
  const bool = crypto.verify(body, signature, publickey)
  return bool
}
// const DB = require('my-db')
// const masterDB = DB('alice')
// const addressDB = masterDB.sub('addressbook')
// const jobsDB = masterDB.sub('jobs')
// const attestorDB = masterDB.sub('attestor')
// const addressesDB = attestorDB.sub('addressbook')
async function load_user (from, id, data) {
  const userDB = await db.sub(from)
  var publickey = await userDB.get('publickey')
  if (id === 0) { // type === 'register'
    if (publickey) throw new Error('user already exists')
    await userDB.set('publickey', data)
  } else {
    if (!publickey) throw new Error('unknown user')
    const nonce = await userDB.get('nonce')
    if (id !== (nonce + 1)) throw new Error('invalid nonce')
  }
  await userDB.set('nonce', id)
  return publickey || body
}
function handleError (...args) { log(args) }
```

# RECEIVE with hypercore
```JS
function receive (message) {
  const { type, data } = message
  if (type === 'register') {
    const feedkey = data
    const userDB = await db.sub(feedkey)
    if (await userDB.get('feedkey')) throw new Error('user already known')
    await userDB.set('feedkey', feedkey)
    const userfeed = hypercore(feedkey)
    connections[feedkey] = userfeed
    const name = hash(feedkey) // discovery key
    hyperswarm.join(name).pipe(feed).on(message => {
      const { type, data } = message
      const id = feed.length
      const from = name
      const msg = {
        flow: [from, id]
        type,
        data,
      }
      handleVerifiedUserMessage(msg)
    })
  }
}
```
