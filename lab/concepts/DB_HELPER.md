# DB_HELPER

```js
machine = xstate.Machine({
  initial: 'digit',
  states: {
    digit: {
      on: {
        increment: [
          { cond: (i) => i%3 == 0, target: 'fizz' },
          { target: 'digit' }
        ]
      },
      onEntry : 'print_digit'
    },
    fizz: {
      on: { increment: 'digit' },
      onEntry : 'print_fizz'
    }
  }
})
const actions = {
  print_digit: i => document.write('<li>' + i + '</li>'),
  print_fizz: () => document.write('<li>Fizz</li>')
}
let state = machine.initialState
for (let i = 1; i <= 100; i++) {
  state = machine.transition(state, 'increment', i);
  state.actions.forEach(item => actions[item](i));
}
```

# PARALLEL
```js
const wordMachine = Machine({
  id: 'word',
  type: 'parallel',
  states: {
    bold: {
      initial: 'off',
      states: {
        go: {
          on: { TOGGLE_BOLD: 'off' }
        },
        off: {
          on: { TOGGLE_BOLD: 'go' }
        }
      }
    },
    underline: {
      initial: 'off',
      states: {
        go: {
          on: { TOGGLE_UNDERLINE: 'off' }
        },
        off: {
          on: { TOGGLE_UNDERLINE: 'go' }
        }
      }
    },
    italics: {
      initial: 'off',
      states: {
        go: {
          on: { TOGGLE_ITALICS: 'off' }
        },
        off: {
          on: { TOGGLE_ITALICS: 'go' }
        }
      }
    },
    list: {
      initial: 'none',
      states: {
        none: {
          on: { BULLETS: 'bullets', NUMBERS: 'numbers' }
        },
        bullets: {
          on: { NONE: 'none', NUMBERS: 'numbers' }
        },
        numbers: {
          on: { BULLETS: 'bullets', NONE: 'none' }
        }
      }
    }
  }
})
const boldState = wordMachine.transition('bold.off', 'TOGGLE_BOLD').value
// {
//   bold: 'on',
//   italics: 'off',
//   underline: 'off',
//   list: 'none'
// }
const nextState = wordMachine.transition(
  {
    bold: 'off',
    italics: 'off',
    underline: 'on',
    list: 'bullets'
  },
  'TOGGLE_ITALICS'
).value
// {
//   bold: 'off',
//   italics: 'on',
//   underline: 'on',
//   list: 'bullets'
// }
```
# HISTORY STATES
```js
const paymentMachine = Machine({
  id: 'payment',
  initial: 'method',
  states: {
    method: {
      initial: 'cash',
      states: {
        cash: { on: { SWITCH_CHECK: 'check' } },
        check: { on: { SWITCH_CASH: 'cash' } },
        hist: { type: 'history' }
      },
      on: { NEXT: 'review' }
    },
    review: {
      on: { PREVIOUS: 'method.hist' }
    }
  }
})
const checkState = paymentMachine.transition('method.cash', 'SWITCH_CHECK')
// => State {
//   value: { method: 'check' },
//   history: State { ... }
// }
const reviewState = paymentMachine.transition(checkState, 'NEXT')
// => State {
//   value: 'review',
//   history: State { ... }
// }
const previousState = paymentMachine.transition(reviewState, 'PREVIOUS').value
```

# EXPERIMENTS

```js
node(msg => {

})
node('foo/bar#!watch', msg => {

})

node('asdf')

const node = make('NODE', _ => {
  // _ = SWITCHBOARD, $ = PEER

  // POOLS: (manage peers locally)
  // * MAKE
  const _pool  = _``      // make pool
  const _poolA = _`poolA` // make pool
  const _poolB = _`poolB` // make pool
  // * VIEW
  const _poolAB = _(_poolA, _poolB) // make virtual pool
  //   join virtual pool => join all individual pools
  // * DISSOLVE
  _poolAB._() // dissolve pool and all connections
  // -------------------------------------------------
  // POOL PEERS: (interact with peers)
  // * RECEIVE
  _($ => console.log($)) // message from any (new/anonymous) peer
  _($ => $(msg => console.log(msg)))
  // * ADD (to pool): NEW/UNKNOWN peer (e.g. remember for broadcast)
  _($ => _``($(msg => console.log(msg))))
  _($ => _`poolA`($)`poolB`($)) // add NEW/UNKNOWN peer to pool A and B
  _($ => _`poolA|poolB|poolC`($)) // @TODO: maybe allow this
  // -------------------------------------------------

  // MAKE POOL
  const pool = _('') 
  const poolA = _('poolA')
  const poolB = _('poolB')
  // DESTROY POOL
  poolB._()
  // JOIN POOL
  pool`joinA`(poolA) // === pool`joinA`($ => poolA($))
  // SWITCH POOL
  _poolA`switchAB`(_poolB, _poolA._) // ===
  _poolA`switchAB`($ => _poolB($), $ => _poolA._($))
  // QUIT POOL
  poolA`quitA`(poolA._) // === poolA`quitA`($ => poolA._($))


  // SEND
  const msg = _('msg') // ???

  const msg = _`typeA`('msg') // broadcast message to all of typeA
  const msg = _poolA`typeA`('msg') // broadcast message to poolA of typeA
  const msg = peerX`typeB`('msg') // message to peerX of typeB

  _x(msg) // send message to pool X
  $x(msg) // send message to peer X

  _x($ => $(msg => {})) // receive message from pool X from peer

  $`typeA`('msg') // individual pool


  // RECEIVE
  _($ => $(M => {})) // any type message from new/anonymous/unknown peer
  _`typeA`($ => $(M => {})) // message from any of typeA
  _poolA`typeA`($ => $(M => {})) // typaA message from any of poolA
  peerX`typeB`($ => $(M => {})) // typeB message from peerX



  poolA`broadcast`($ => _($)) // send to ALL KNOWN
  // ??? add peer to ALL POOL ???





  // on joinA, add NEW/UNKNOWN peer to poolA
  _($ => $`joinA`(_`poolA`)
  
  
  _($ => $`joinA`(poolA_, poolB_)`join`(poolA_, poolB_)
  _($ => $`joinA`(poolAB_)`join`(poolAB_)
  _($ => $`joinA|join`(_`poolA|poolB`)) // maybe allow 

  _($ => { // maybe allow 
    const poolA = _`poolA`
    const poolB = _`poolB`
    $`join`(poolA, poolB)`joinA`(poolA, poolB)

    const pools = _`poolA`($`join``joinB`)`poolB`($`join``joinB`)
    $`joinA`(pools)`join`(pools)
  })


  _($ => _`poolA`($`join``joinB`)`poolB`($`join``joinB`))
  _($ => _`poolA`($`join`)`poolA`(`joinB`)`poolB`($`join``joinB`))

    // => to join multiple pools on any of the message types

  // ....

  // a message from known/pool peer
  _``($ => {}) // a message from any (known) peer
  _`pool`($ => console.log($)) // message from a peer in pool
  _`pool`($ => $(msg => console.log(msg)))
  // message of type from peer of pool
  _`pool`($ => $`type`(msg => {})) // drop peer from pool
  _`pool`($ => _`pool`($`type`(msg => {}))) // keep peer in pool
  // change pool membership based on message types
  _``($ => _`poolA`($)) // add known peer to poolA
  _`poolA`($ => _`poolA`._($)) // drop peer from poolA
  // on quitA, drop peer from poolA
  _`poolA`($ => $`quitA`(_`poolA`._($)))


  const msg = _`pool`('msg') // msg helper
  _(msg) // send/broadcast to recipient(s)

  // SWITCHBOARD
  _`poolA`($ => _`poolA`($`typeX`(_`poolB`))) // keep peer
  _`poolA`($ => $`typeX`(_`poolB`)) // drop peer



  _```typeX`($ => _`poolA`($)) // add peer to poolA
  _`poolA:typeY`($ => _`poolA`._($)) // drop peer from poolA
  
  _`poolA:typeX`(handle`typeY`(_`poolB`))) // keep peer


  _`poolA`($ => $`typeX`(_`poolB`)) // drop peer


  $``(fn) // listen any type
  $`type`(fn) // listen type
  const msg = $`type`('msg') // make type msg
  const msg = $``('msg') // make any msg
  $(msg) // send msg
  $(fn) 




  // handle connections and push them into pools
  // e.g. single named connections
  // e.g. single named pools
  // make, add, remove, delete

})
```



```js
const node = make('NODE', _ => {
  // SWITCHBOARD multiplex socket (_)
  // --------------------------------------------
  _() // root multiplex socket
  _('name') // named multiplex socket
  /*???*/_($ => console.log($)) // log peer msg
  // --------------------------------------------
  // POOL (= multiplex socket)
  const _rootpool = _()
  // const name = _('(FEED MOUNT ADDRESS PATTERNS)')
  const _localname1 = _('local/name1')
  const _foobar = _('foo/bar')
  const _beepboop = _('beep/boop')
  const _foobarbaz = _foobar('baz')
  const _beepboopbop = _beepboop('bop')
  // TEAM POOL
  const _bopbaz = _(_beepboopbop, _foobarbaz)
  // can be peer pools with different addresses
  // => receiving message from ANY
  // => broadcasting message to ALL
  // --------------------------------------------
  // FEATURES:
  // 1. DEFINE INCOMING multiplex SOCKETS
  // 2. DEFINE OUTGOING multiplex SOCKETS
  // 3. DEFINE INTERNAL multiplex (helper) SOCKETS
  // socket vs. pool
  // => socket is busy or not
  // => pool can receive many messages (= multiplex socket)
  // on new connection (any pool)
  // --------------------------------------------

  const pool1 = _`pool1`
  const pool1a = pool1`a`

  const msg = pool1a`typeX`('foo')

  const pool1 = _.$('pool1') // peer pool1
  const pool1a = pool1.$('a') // peer pool1/a

  const pool1 = _.$`typeX`('pool1') // peer pool1
  const pool1a = pool1.$`subtypeX`('a') // peer pool1/a

  const msg = _`typeX`('msg')

  const pool1name = pool1`typeX`('name')

  const msg = pool1.$`typex`('msg')
  pool1(msg)


  pool() // ???
  pool('name') // make sub pool
  /*???*/pool($ => console.log($)) // log pool peer msg

  pool`typeA`()
  const msg = pool`typeA`('msg')
  pool`typeA`($ => console.log($))

  _`asdf`()
  _`asdf`('msg')
  _`asdf`(FN)
  _`asdf`._()
  _`asdf`._('msg')
  _`asdf`._(FN)


  _localname1`typeX`($ =>)


  _($ => console.log($))

  _`typeA`

  _`poolA`

  _`fromX`


  // WATCH
  // (path === from === peer) vs. type
  foobarDB`baz`(msg => console.log(msg))

})
```

-----------------------------------------------------------

```js
  const emitter = {
    name: 'failed-hosting',
  }
  const emitter = {
    name: 'unregister-hoster',
      set DB.user[5].hoster = {}
      del DB.idleHosters[i]
  }
  const unregister_hoster_matcher = (type, path, value) => {
    return (type === 'set' && path.includes('.hoster') && JSON.stringify(value) === '{}')
  }
  const emitter = {
    name: 'unregister-hoster',
    match: unregister_hoster_matcher,
    get_data: (path, val) => ({ userID: path.split('[')[1].split(']')[0], value: val })
  }

  const emitter = {
    name: 'repair-hosting',
    // 1. failed hosting
      // amendment_report => new amendment
      push DB.contracts.amendments
      push DB.amendments
      push DB.pendingAmendments
    // 2. unregister hoster
      push DB.contracts.amendments
      push DB.amendments
      push DB.pendingAmendments
    // 3. hoster failed challenges more than X times
      del DB.contract[12].activeHosters[i]
      set DB.user[4].hoster.rating
      // new amendment
      push DB.contracts.amendments
      push DB.amendments
      push DB.pendingAmendments
    // 4. hoster rating drops below 3 stars
      del DB.contract[12].activeHosters[i]
      set DB.user[4].hoster.rating
      // new amendment
      push DB.contracts.amendments
      push DB.amendments
      push DB.pendingAmendments
  }

  // const emitters = {
  //   "balance": {
  //     match: (type, path) => (type === 'set' || type === 'push' && path.includes('balance')),
  //     get_data: (path, val) => ({ userID: path.split('[')[1].split(']')[0], value: val })
  //   },
  //   "rating": {
  //
  //   },
  //   "plan-ranges": {
  //
  //   }
  // }
  // const emitter = [
  //   'balance', [
  //     `provider/:id/:role/rating`
  //   ]  
  // ]
  // db_on(route, event => {
  //
  // })
  // var route = query = `provider/:id/:role/rating`
  //
  // db_on(change)
  // db_on(query)
  // db_on(path)
  // db.addEmitter('balance', [
  //   [['set', 'push'], 'provider/5/attestor/balance'],
  //   ['set', 'provider/6/attestor/balance'],
  //   ['set', 'provider/6/encoder/balance'],
  // ])
  // db.addEmitter('balance', [
  //   [['set', 'push'], 'provider/:id/:role/balance']
  // ])
  // db.addEmitter('balance', [
  //   `provider/:id/:role/rating`
  // ])
  // const path = route.split('/') // [route1, route2, route3]
  // const fn = i => { while (key = path[i]) { obj = obj[key] } }
```


# MATCHING SUMMARY

```js
// --------------------------------------------------------
// --------------------------------------------------------
// TAKE 1
// --------------------------------------------------------
// --------------------------------------------------------
const db_helper = require('db_helper')
const db = db_helper(DATA)
const { run, addEmitter, addActions, on } = db

// LESEZEICHEN

// --------------------------------------------------------
// EMITTER
// --------------------------------------------------------
// EVENT has MANY UNIQUE LISTENERS
// EVENT has ONE UNIQUE TRIGGER
addEmitter({ name: 'balance',
  match: (type, path) => (type === 'set' || type === 'push' && path.includes('balance'))
  get_data: (path, val) => ({ userID: path.split('[')[1].split(']')[0], value: val })
})
db.addEmitter({ name: 'plan-ranges',
  match: (type, path) => { if (path.includes('ranges')) return 'plan-ranges' },
  get_data: (path, val) => ({ contractID: path.split('contracts[')[1].split(']')[0], value: val })
})

// --------------------------------------------------------
// ON
// --------------------------------------------------------
on('roles_unregister', data => {
  // ???
})
on('balance', event => { // 'users[17].hoster.balance'
 const { userID, value, old_value } = event
})
on('rating', event => {
  const { id } = event
})
on('balance', event => { })
on('rating', event => { })
on('rating', event => { })
on('rating', event => { })

// --------------------------------------------------------
// RUN
// --------------------------------------------------------


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
addActions('storage[15]', [{
  create: (DB, path, val) => {
    var id = DB[path].length
    val.id = id
    DB[path].push(val)
    return id
  }
}, {
  push: (DB, path, val) => {
    var id = DB[path].length
    val.id = id
    DB[path].push(val)
    return id
  }
}])


const defintion = {
  inputs: {
    foo: { type: 'string', required: true },
    bar: { type: 'number' },
  },
  exits: { /*…*/ },
  'do-something-cool': (inputs, exits) => {
    let result = `The result, based on ${inputs.foo}`
    if (inputs.bar) result += ` and ${inputs.bar}.`
    return exits.success(result)
  }
}
const run = addActions(definition)


run.getDef()
run.customize()
 
const argins = { foo: 'bar' }
const deferred = run(argins)
deferred.log()
deferred.then()
deferred.catch()
deferred.exec()
deferred.switch()
deferred.meta()
const result = await deferred
console.log(result)
// => 'The result, based on "bar"'.
// => 'The result, based on "abc" and "123"'.

// let result = customCallable('abc', 123)

```
