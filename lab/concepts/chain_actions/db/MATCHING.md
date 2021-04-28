# STREAMLINED MATCHING / RESOURCE MANAGEMENT
```js
// 1. take jobs from priority queue
// 2. match to providers from pool

// ... sometimes this might include re-assigning already busy providers

const opts1 = {}
const opts2 = {
  jobs: {
    'hosting': jobID => {

    }
  }
}


const queue = require('priority-queue')(opts1)
const pool = require('provider-pool')(opts2)

//
// pool.add(providerID)
// pool.del(providerID)

pool.registerJob('storage-proof', compare)

function compare (self, jobID) {
  // ...
  // const allproviders = self.listProviders()


}

// ....

on('block', block => {
  // ....

  // pool.getProviders({ attestors: 3, encoders: 2 })
  // const bool = pool.match('hosting', jobID)
  // const event = pool.match('storage-proof', jobID)
  // pool.match('performance-proof', jobID)

  const queue = priorityQueue(db.sub('jobs'), function compare () {})

  const provider = { type, id }
  pool.add(provider)
  pool.add(provider)
  pool.del(provider)

  const job = { type, id }
  queue.add(job)
  queue.add(job)
  queue.del(id)

  const providers = [[10, provider1], [20, provider2], [15, provider3], [12, provider4]]
  providers.forEach(([amount, provider]) => pool.mint({amount, provider}))

  const sponsors = [[10, sponsor1], [20, sponsor2], [15, sponsor3], [12, sponsor4]]
  sponsors.forEach(([amount, sponsor]) => pool.burn({amount, sponsor}))

  // 1. PAYMENTS to PROVIDERS change PRIORITY_QUEUE
  // 2. RATINGS about PROVIDERS change RESOURCE_STRUCTURE

  const reports = [[report1, provider1], [report2, provider2]]
  reports.forEach(([report, provider]) => pool.rate({provider, report}))

  // ...
  book.mint() // ...
  book.burn() // ...
  book.rate() // ...
  market.add('provider', providerID)
  market.add('job', jobID)
  const { demand, supply, onmatch } = market()
  demand.order('hosting', hosting_plan)
  demand.order('support', plan)
  const market = economy((supply, demand) => onreport)
  on('report', data => {
    // ...
  })

// ---------------------------------------------------
// ---------------------------------------------------
// ---------------------------------------------------

  const providers = db.sub('providers')
  const hosters = providers.sub('hoster')
  const encoders = providers.sub('encoder')
  const attestors = providers.sub('attestor')

  // addItem(item)
  // getItem(id)
  // delItem(id)
  // updateItem(id, item)
  const id = addItem(provider)
  const provider = getItem(id)
  updateItem(id, provider)

  providers.on((key, value) => {
    if (key === 'providers/hoster') {
      //
      return
    }
    if (key === 'providers/encoder') {
      //
      return
    }
    if (key === 'providers/attestor') {
      //
      return
    }
  })

// ---------------------------------------------------
// ---------------------------------------------------
// ---------------------------------------------------

  bank.register('hoster', id)
  bank.register('encoder', id)
  bank.register('attestor', id)

  hosters.add(id)
  encoders.add(id)
  attestors.add(id)


  db.append(event)
  db.on(event => console.log(event))
  // { id: 1, type: 'add', data: value }

  const key = db.add(value)
  const value = await db.get(key)
  db.set(key, value)
  db.del(key)

  // providers.on('')

  mint(id, amount)
  burn(id, amount)
  // providers.mint(id, amount)
  // providers.burn(id, amount)

  // providers.register('')
  register()
  unregister()


// ---------------------------------------------------
// ---------------------------------------------------
// ---------------------------------------------------


const wobble = DB.foo.bar.baz[8].beep.boop[123].wibble.wobble
const wobble_path = 'foo.bar.baz[8].beep.boop[123].wibble.wobble'

db_helper('push', wobble_path, true)

const hosters_path = 'foo.bar.baz[8].beep.boop[123].wibble.wobble.providers.hosters'

db_helper('set', 'foo.bar.baz[8].beep.boop[123].wibble.wobble.providers.hosters[0].balance', 2000)
db_helper('set', 'foo.bar.baz[8].beep.boop[123].wibble.wobble.providers.hosters[0].rating.bandwidth', 50)
db_helper('set', 'foo.bar.baz[8].beep.boop[123].wibble.wobble.providers.hosters[0].rating.latency', 25)

db_helper('set', 'foo.bar.baz[8].beep.boop[123].wibble.wobble.providers.hosters[1].balance', 2000)
db_helper('set', 'foo.bar.baz[8].beep.boop[123].wibble.wobble.providers.hosters[1].rating.bandwidth', 50)
db_helper('set', 'foo.bar.baz[8].beep.boop[123].wibble.wobble.providers.hosters[1].rating.latency', 25)


db_helper('set', `${hosters_path}[0].balance`, 2000)
db_helper('set', `${hosters_path}[0].rating.bandwidth`, 50)
db_helper('set', `${hosters_path}[0].rating.latency`, 25)

db_helper('set', `${hosters_path}[1].balance`, 2000)
db_helper('set', `${hosters_path}[1].rating.bandwidth`, 50)
db_helper('set', `${hosters_path}[1].rating.latency`, 25)

DB.foo.bar.baz[8].beep.boop[123].wibble.wobble.providers.hosters[1].rating.latency = 25
DB.foo.bar.baz[8].beep.boop[123].wibble.wobble.providers.hosters[1].rating.bandwidth = 50
// DB.foo.bar.baz[8].beep.boop[123].wibble.wobble.providers.hosters[1].rating = { latency: 25, bandwidth: 50 }
DB.foo.bar.baz[8].beep.boop[123].wibble.wobble.providers.hosters[1].balance = 25

const hosters_path = 'foo.bar.baz[8].beep.boop[123].wibble.wobble.providers.hosters'
const alice = `${hosters_path}[0]`
const bob = `${hosters_path}[1]`

const user = DB.foo.bar.baz[8].beep.boop[123].wibble.wobble.providers.hosters[1]
user.rating.latency = 25
user.rating.bandwidth = 50
user.balance = 25
emitEvent('foo.bar.baz[8].beep.boop[123].wibble.wobble.providers.hosters', { latency, bandwidth })

// --------------------------------------------------------
// --------------------------------------------------------
// --------------------------------------------------------
// --------------------------------------------------------
// --------------------------------------------------------
// --------------------------------------------------------
// --------------------------------------------------------
// --------------------------------------------------------
// --------------------------------------------------------
// --------------------------------------------------------
// --------------------------------------------------------
// --------------------------------------------------------
// --------------------------------------------------------
// --------------------------------------------------------
// --------------------------------------------------------
// --------------------------------------------------------
// --------------------------------------------------------
// --------------------------------------------------------


// --------------------------------------------------------
// DATA
// --------------------------------------------------------
const path  = 'users[17].hoster.balance'
const val   = 2500
const path1 = 'foo/bar/8/baz'
const val1  = 123
const path2 = 'foo.bar.baz'
const val2  = 456
const path3 = 'provider/5/hoster/rating'
const val3  = { bandwidth: 5, latency: 0.3 }
// {a:'b',foo:{bar:[0,1,2,3,4,5,6,7,{baz:'foobar'}]}}
const DATA = require('./db.json')
// --------------------------------------------------------
// --------------------------------------------------------
// DB HELPER USAGE SPECIFICATION
// --------------------------------------------------------
// --------------------------------------------------------
const db_helper = require('db_helper')
const db = db_helper(DATA)
const { run, addEmitter, addActions, on } = db
// --------------------------------------------------------
// EMITTER
// --------------------------------------------------------
db.addEmitter({ name: 'rating',
  match: (type, path) => { if (path.includes('rating')) return 'rating' },
  get_data: (path, val) => ({ userID: path.split('[')[1].split(']')[0], value: val })
})
db.addEmitter({ name: 'plan-ranges',
  match: (type, path) => { if (path.includes('ranges')) return 'plan-ranges' },
  get_data: (path, val) => ({ contractID: path.split('contracts[')[1].split(']')[0], value: val })
})
// -----
db.addEmitter({
  name: 'roles_unregister',
  match: (type, path, value) => {},
  get_data: (path, value) => {},
})
// --------------------------------------------------------
// ON
// --------------------------------------------------------
on('roles_unregister', data => {
  // ???
})

// LESEZEICHEN: MATCHING.md#230


// --------------------------------------------------------
// ACTION
// --------------------------------------------------------
// ACTION has ONE UNIQUE HANDLER
// ACTION has MANY UNIQUE TRIGGERS
db.addAction({
  'roles_unregister': data => {

  }
})
// -----
// const arrayActions = require('./actions/arrayAction')
const arrayActions = {
  set: (DB, path, val) => { DB[path] = val },
  get: (DB, path) => { return DB[path] },
  pop: (DB, path, val) => DB[path].pop(),
  // push: (DB, path, val) => DB[path].push(val),
  push: (DB, path, val) => {
    leveldb.get(path, (err, data) => {
      if (!err && !Array.isArray(data)) throw new Error('')
      leveldb.set(path, val, err => {

      })
    })
    // DB[path].push(val)
  },
}
const idleActions = {
  make: (DB, path, val) => { DB[path] = [] },
  getall: (DB, path, val) => { return DB[path] },
  ...arrayActions,
}
addActions('status/idleHosters', idleActions)
addActions('status/idleAttestors', idleActions)
addActions('status/idleEncoders', idleActions)

const run_db_storage = addActions('DB/storage', {
  add: (path, db, val) => {

  }
})
// --------------------------------------------------------
// RUN
// --------------------------------------------------------
const data = { challenge: 123 }

run('add', 'DB/storage', data)
// VS.
run_db_storage('add', data)


await run('create', 'DB/storage', data)
await run('add', 'DB/storage', data)

const id = await run('append', 'DB/storage', data)
const data = await run('get', `DB/storage/${id}`)

const id = await run('push', 'DB/storage', data)
// const id = await run('set', 'DB/storage', data)
// const data = await run('get', `DB/storage/${id}`)
await run('set', `DB/storage/${id}`, id)
// --------------------------------------------------------
// DB[path] = val
// DB.provider[5].hoster.rating = { bandwidth, latency }
// emit('set', path, val)
// VS.
const len1 = await run('push', path2, val2)
const len2 = await run('push', path2, val2)
const x3 = await run('pop', path1)
const x4 = await run('pop', path2)
run('set', path, val)              // default action: SET
const x1 = await run('get', path)  // default action: GET

// --------------------------------------------------------
// --------------------------------------------------------
// --------------------------------------------------------
// --------------------------------------------------------

// IMPLEMENTATION:
module.exports = db_helper

function db_helper (all) {
  const REGISTRY = { DB: all, actions }
  return { run, addEmitter, addAction, on }
  // function db (fn) { return fn ? DB(fn(all)) : all }
  //////////////////////////////////////////////////////////
  function run (type, path, val) {
    // e.g. path = 'users[17].hoster.balance'
    // e.g. type = 'push'
    // e.g. val = 2500
    const { DB, actions, events } = REGISTRY
    const action = actions[type]
    if (!action) throw new Error(`invalid type "${type}"`)
    action(DB, path, val)
    emit(DB, type, path, val)

    // const event_name = lookup(action, path, val)
    // if (event_name) {
    //   const event = get_data(action, path, val)
    //   emit(event)
    // }
  }
  //////////////////////////////////////////////////////////
  function emit (DB, type, path, val) {
    const emitter = match_emitter(path, type) // e.g.  user/5/hoster/balance, set =>  "balance" handlers
    if (emitter) {
      const { get_data, handlers } = emitter
      const value = get_data(path, val)
      handlers.forEach(handler => handler(type, path, value)) // emit event to all listeners
    }
  }
  function match_emitter (path, type) {
    const { emitters } = REGISTRY
    const names = Object.keys(emitters)
    for (var i = 0, len = names.length; i < names; i++) {
      const name = names[i]
      const { handlers, match, get_data } = emitters[name]
      if (match(type, path)) return { get_data, handlers }
    }
  }
  //////////////////////////////////////////////////////////
  // const balance_matcher = (type, path) => {
  //   return (type === 'set' || type === 'push' && path.includes('balance'))
  // }
  // const emitter = {
  //   name: 'balance',
  //   match: balance_matcher,
  //   get_data: (path, val) => ({ userID: path.split('[')[1].split(']')[0], value: val })
  // }
  // db.addEmitter(emitter)
  function addEmitter (emitter) {
    const { name, match, get_data } = emitter
    if (REGISTRY.emitters[name]) throw new Error(`emitter "${name}" exists already`)
    REGISTRY.emitters[name] = { handlers: [], match, get_data }
  }
  //////////////////////////////////////////////////////////
  // const actions = {
  //   set: (DB, path, val) => { DB[path] = val },
  //   get: (DB, path) => { return DB[path] },
  //   push: (DB, path, val) => DB[path].push(val),
  //   pop: (DB, path, val) => DB[path].pop()
  // }
  // db.addActions(actions)
  function addAction (actions) {
    const keys = Object.keys(actions)
    for (var i = 0, len = keys.length; i < len; i++) {
      const key = keys[i]
      if (REGISTRY.actions[key]) throw new Error(`action "${key}" exists already`)
      const action = actions[key]
      if (typeof action !== 'function') throw new Error(`action "${key}" is not a function`)
    }
    REGISTRY.actions = { ...REGISTRY.actions, ...actions }
  }
  //////////////////////////////////////////////////////////
  // db.on('balance', event => { })
  function on (name, handler) {
    const match = routes(name)
    // ...
// -----------------------

const Machine = require('machine')

const definition = {
  identity: 'do-something-cool',

  fn: 
}
const callable = Machine(definition)

    routes[route].push(handler)
    update_matcher(route, handler)
  }
}


// --------------------------------------------------------
// --------------------------------------------------------
// --------------------------------------------------------
// --------------------------------------------------------
// --------------------------------------------------------
// --------------------------------------------------------
// --------------------------------------------------------
// --------------------------------------------------------
// --------------------------------------------------------
// --------------------------------------------------------
// --------------------------------------------------------
// --------------------------------------------------------
// --------------------------------------------------------
// --------------------------------------------------------
// --------------------------------------------------------
// --------------------------------------------------------
// --------------------------------------------------------
// --------------------------------------------------------



// LESEZEICHEN: MATCHING.md#480

db_helper$('set', [
  // [`${alice}.name`, 'alisa'], // change name of alice
  [`${alice}.balance`, 2000],
  [`${alice}.rating`, { bandwidth: 50, latency: 25 }],
  [`${bob}.balance`, 2000],
  [`${bob}.rating`, { bandwidth: 50, latency: 25 }]
])
db_helper$('push', [
  [hosters_path, { name: 'eve', balance: 2000, rating: { bandwidth: 100, latency:30 } }],
])
db_helper$('set', `${alice}.balance`, 2000)
db_helper$('set', `${alice}.rating`, { bandwidth: 50, latency: 25 })

db_helper$('set', `${bob}.balance`, 2000)
db_helper$('set', `${bob}.rating.`, { bandwidth: 50, latency: 25 })
////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////
const x1 = await db_helper('foo/bar/8/baz')                  // default action: GET
const x2 = await db_helper('foo/bar/8/baz', 'foobar')        // default action: SET
const x3 = await db_helper('foo/bar/8', { baz: 'foobar' })   // default action: SET
const d  = db.sub('foo/bar/8')
const x4 = d('baz') // x4 === x1
console.log({x1, x2, x3}) // { x1: [object Object], x2: true, x3: true }

const db_helper_hosters$ = db_helper$.sub_helper(hosters_path)

db_helper_hosters$('set', `[0].balance`, 2000)
db_helper_hosters$('set', `[0].rating`, { bandwidth: 50, latency: 25 })

db_helper_hosters$('set', `[1].balance`, 2000)
db_helper_hosters$('set', `[1].rating`, { bandwidth: 50, latency: 25 })


const alice$ = db_helper_hosters.sub(0)
const bob$ = db_helper_hosters.sub(1)

alice$('set', `balance`, 2000)
alice$('set', `rating`, { bandwidth: 50, latency: 25 })

bob$('set', `balance`, 2000)
bob$('set', `rating`, { bandwidth: 50, latency: 25 })

// --------------------------------------------------------
// --------------------------------------------------------
// --------------------------------------------------------
// --------------------------------------------------------
// --------------------------------------------------------
// --------------------------------------------------------
// --------------------------------------------------------
// --------------------------------------------------------
// --------------------------------------------------------
// --------------------------------------------------------
// --------------------------------------------------------
// --------------------------------------------------------
// --------------------------------------------------------
// --------------------------------------------------------
// --------------------------------------------------------
// --------------------------------------------------------
// --------------------------------------------------------
// --------------------------------------------------------

// LESEZEICHEN

async function test (db) {
  // ---------------------------------------------------
  // FEATURE: PARTITION DB
  // ---------------------------------------------------
  db('foo/bar/8/baz', 'foobar')        // default action: SET
  const x1 = db('foo/bar/8/baz')       // default action: GET
  console.log(x1) // 'foobar'
  const x1 = db('foo/bar/8')           // default action: GET
  console.log(x1) // { baz: 'foobar' }
  const d  = db.sub('foo/bar/8')
  const x4 = d('')
  console.log(x4) // { baz: 'foobar' }
  const x4 = d('baz')
  console.log(x4) // 'foobar'
  // ---------------------------------------------------
  // FEATURE: BATCH
  // ---------------------------------------------------
  const result = await db.get(query)
  const batch = db.batch()
  batch.add()
  batch.add()
  batch.set()
  batch.commit()
  // ---------------------------------------------------
  // FEATURE: TYPES
  // ---------------------------------------------------
  db.fn('fn/filterTodo', {
    'array': val => Array.isArray(val),
    'string': String,
    'boolean': Boolean,
    'object': Object,
    'buffer': Buffer,
    'number': Number,
    'float': Number,
    'integer': val => Number.isInteger(val),
  })
  // ---------------------------------------------------
  // ACTIONS
  // ---------------------------------------------------
  const fnName = 'fn/filterTodo'
  const fnName = 'foo/bar'
  const run$ = db(fnName, async function jsonType ($) {
    const { load, test, work, save, name } = $
    // name = 'fn/filterTodo'
    const jsonType = {
      foo: db.type('number'),
      bar: db.type('array')
    }
    work(jsonType)
  })
  // custom action: PUSH
  run$('foo/bar#!push', { bar: 'foobar' }) 
  // VS.
  run$('push', 'foo/bar', { bar: 'foobar' })
  // ---------------------------------------------------
  db.on('foo/bar/8', ({ name /* = 'foo/bar/8' */ }) => {
    const { load, test, work, save, name } = $
    var value = await load(x => value = x)
    work({
      set: async data => {
        await test(data) // data === { baz: 'foobar' }
        const old = value
        value = data
        return now
      }
    })
    return () => save(value)
  })
  db.on('foo/bar/8/baz', ({ name /*= 'foo/bar/8/baz'*/}) => {
    const { load, test, work, save, name } = $
    var value = await load(x => value = x)
    work({
      set: async data => {
        await test(data) // data === 'foobar'
        const old = value
        value = data
        return data
      }
    })
    return () => save(value)
  })
  // ---------------------------------------------------
  db.on('', async $ => { // === db.on(async (old, now) => {})
    const { load, test, work, save, name } = $ // name = ''
    var value = await load(x => value = x)
    work({
      set: async data => {
        await test(data) // data === { foo: { bar: [..., { baz: 'foobar' }, ...] } }
        const old = value
        value = data
        return data
      }
    })
    return () => save(value)
  })
  db.on('foo', ({ name /* = 'foo' */ }) => {
    const { load, test, work, save, name } = $
    var value = await load(x => value = x)
    work({
      set: async data => {
        await test(data) // data === { bar: [..., { baz: 'foobar' }, ...] }
        const old = value
        value = data
        return data
      }
    })
    return () => save(value)
  })
  db.on('foo/bar', ({ name /* = 'foo/bar' */ }) => { // ARRAY
    const { load, test, work, save, name } = $
    const values = await load(x => values = x) || []
    var length = values.length
    work({
      get: async data => {
        const i = data
        return values[i]
      },
      // sort: async data => {
      //   const compare = data
      //   return values = values.sort(compare)
      // },
      push: async (data, old) => {
        await test(data) // now === [..., { baz: 'foobar' }, ...]
        const i = length++
        values[i] = data
        return length
      },
      set: async (data, old) => {
        await test(data) // now === { type: 'push', data: { bar: 'foobar' } }
        const [i, value] = data
        const old = values[i]
        return values[i] = data
      }
    })
    return () => save(value)
  })
}

// --------------------------------------------------------
// --------------------------------------------------------
// --------------------------------------------------------
// --------------------------------------------------------
// --------------------------------------------------------
// --------------------------------------------------------
// --------------------------------------------------------
// --------------------------------------------------------
// --------------------------------------------------------
// --------------------------------------------------------
// --------------------------------------------------------
// --------------------------------------------------------
// --------------------------------------------------------
// --------------------------------------------------------
// --------------------------------------------------------
// --------------------------------------------------------
// --------------------------------------------------------
// --------------------------------------------------------



async function transaction (db) {
  const transaction = db.transaction()
  const title = 'foobar'
  const [error, results, fields] = await transaction.query('INSERT INTO posts SET title=?', title)
  const fields = { foo: 'string', bar: { baz: 'number' } }
  const results = [{ foo: 'hello', bar: { baz: 123} }]

  if (error) return transaction.rollback()
  var value = 'Post ' + results.insertId + ' added'
  const [error, results, fields] = await transaction.query('INSERT INTO log SET data=?', value)
  if (error) return transaction.rollback()
  const error = await transaction.commit()
  if (err) return transaction.rollback()
  console.log('success!')
}

let sql = `CALL filterTodo(?)`;

connection.query(sql, true, (error, results, fields) => {
  if (error) {
    return console.error(error.message);
  }
  console.log(results[0]);
});
// --------------------------------------------------------------------------
  function onreport (report) {
    const { type } = report
    if (type === 'proof_of_storage') {
      supply.mint(providerID, amount1)
      demand.burn(sponsorID, amount2)
      return
    }
    if (type === 'proof_of_performance') {
      supply.mint(providerID, amount1)
      demand.burn(sponsorID, amount2)
      return
    }
    // ...
    // ...
  }

  market.report(data) // => payOnProof(storage/performance) => mint/burn + rate providers
  market.report(data)
  market.report(data)
  market.report(data)
  market.on(changes => { // latest merged changes
    // onmint, onburn, onrating
    // maybe BUFFER some REPORTS, until THRESHOLD
    // => then MINT/BURN/RATE in one go and UPDATE
    if (changes.length > 10) market.commit()
  })

  supply.offer('hoster', id)
  supply.offer('attestor', id)
  supply.offer('encoder', id)
  demand.add(jobID)
  supply.add(providerID)
  onmatch(contracts => {
    // ...

  })

  pool.on(change => {
    const { type, ...rest } = change
    // ...
    // maybe some job priorities changes, so host new and dehost old
    // maybe some provider ratings changed, so unassign old, assign new
    // ...
    const changes = {
      make_jobs: [{
        jobID: providers, // idle and maybe re-assigned busy providers with best match
      }, {
        jobID: providers, // some new, some re-used, because of re-assignments
      }],
      drop_jobs: [{
        jobID,
        providerID,
      }],
    }
    console.log(changes)
  })

  queue.on(change => {
    // TASK: match job to best providers (idle or re-assign busy ones)
    // GOAL: maximize utility of resources
    const { type, id } = job
    const result = await pool.match(type, id)
    console.log(result)/*{
      make_jobs: [{
        jobID: providers, // idle and maybe re-assigned busy providers with best match
      }, {
        jobID: providers, // some new, some re-used, because of re-assignments
      }],
      drop_jobs: [{
        jobID,
        providerID,
      }],
    }*/
  })
})
// --------------------------------------------------------------------------









// --------------------------------------------------------------------------
function doesQualify ({ plan, provider, role }) {
  const form = provider.form
  if (
    isScheduleCompatible({ plan, form, role }) &&
    hasCapacity({ provider, role }) &&
    hasEnoughStorage(provider)
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
function hasEnoughStorage (provider) {
  if (provider.idleStorage > size) return true
}

```
