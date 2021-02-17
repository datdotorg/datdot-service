# Flow (measure + match)

```js
// FLOW
// 1. sponsor publishes plan
//   1. with region
//   2. if no region: chain selects random attestors
//     1. attestors ping sponsor and exchange maps
//     2. sponsor updates plan region on chain
// 3. plan goes into priority queue
// 4. when time comes, to select random attestors oracle
//    1. attestors join swarm to:
//       * measure each other and exchange map
//         * to unify their map
//       * calculate contract sets from ranges
//       * for each contract:
//          * 3x random numbers consensus

//          * to select idle providers for plan.regions

//          * permutate until providers are found
//          * notify chain about new contracts + report
//            * report is signed by all attestors
//            * (=selected providers for each range set)
//            * 
// 5. chain emits event to start hosting new contracts


// IDEA
// 1. publish one event to notify about many challenges
// 2. each pool of attestors have one notary
// 3. notary collects signed responses
// 4. all notaries together sign own response
// 5. all notaries submit all challenge responses as 1 TX
```


# ARCHITECTURE
```js
// GLOBAL MAIN FUNCTION (="tracker")
on('block', block => {
  const { number, extrinsics } = block
  // @TODO: stop or limit executing from calendar or queue IF too many items for current block
  const entries = takeBatch(calendar, queue) // execute CALENDAR and QUEUE
  const tasks = [...entries, ...extrinsics]
  tasks.forEach(execute_task)
})
function execute_task ({ type, id }) {
  const { type, id } = event
  // ACTIONS:
  if (type === 'calendar:execute_plan') queue.add(event)
  if (type === 'queue:execute_plan') _execute_plan(id, trigger)
  // @TODO: make this more detailed
  function trigger (message) {
    const { name, data}
    emit(name, { cite: [type, id], data })
  }
}
```
1. a network of many nodes
2. user makes transaction in frontend and sends it to their node

3. node receives an "pending extrinsic"
4. broadcasts it to the rest of the network
5. those are received by other nodes

4. block producer(s) are selected
5. pending extrinsics are added block
6. blocks are sent out to all nodes
7. when they receive it they execute the blocks extrinsics them and mutate/add them to their nodes state
8. ...start over...

```js
const node = make('NODE', (_, $) => {
  // $ = self (=connected to all peers)
  // _ = pool: cannot send, only make signals to send/receive

  const ROOT = _() // root signal to send/receive all
  ROOT(msg => console.log(msg))
  // POOLS
  const API = _('API')
  const SYNC = _('SYNC')
  // ???
  const CHAIN = $('CHAIN')
  const EVENTS = API('EVENTS')
  const TASKS = API('TASKS') // === extrinsics / transactions

  SYNC`block`(validate(CHAIN))
  SYNC`tasks`(verify`done`(collect)`fail`())
  // @NOTE:
  // => LESEZEICHEN: MATCHING.md#230
  // => LESEZEICHEN: MATCHING.md#480
  // => LESEZEICHEN: MATCHING.md#570
  // ----------------------------------
  $.on`api`(peer => {
    $(peer
      `api`(verify(collect))
      `extrinsic`(collect)
      `block`(execute))
    collect`fail`(peer)
  })
  // ----------------------------------
    const forward = $('forward')
  forward($)
  const api = peer => {
    return peer(verify`done`(collect($.peers)`fail`(peer)))
  }
  $`
    api`(api)`
    extrinsic`(api)
  $`api`(verify(collect))
   `extrinsic`(collect)
   `block`(execute))
  collect`fail`($)
})
```

# SUMMARY

```js
const chain = make('CHAIN', $ => {
  const extrinsics = $('extrinsics') // TASKS
  const actions = $('actions')
  const helpers = $('helpers')
  const emits = $('events')
  // connect
  $(extrinsics(actions(helpers(emits($)))))
})
const service = make('service', $ => {
  const on = $('on') // chain api
  const handlers = $('handlers') // chain api
  const helpers = $('helpers')
  const api = $('api')
  // connect
  $(on(handlers(helpers(api($)))))
})
chain(service(chain))
```

# CHAIN API

```js
// const MAIN_TYPES = { // MAIN
//   batch,
//   make,//_account,
//   give,//_to_account,
//   register,//_feed,
//   offer,//_service,
//   provide,//_service,
//   request,//_service,
// }

// SERVICE

// 15 Extrinsics
account_create()
account_update()
account_delete()
roles_register()
roles_unregister()
plan_subscribe()
plan_update()
plan_pause()
plan_resume()
plan_unsubscribe()
hosting_setup_report(report)
proof_of_storage_request(data)
proof_of_storage_response(proof)
performance_benchmark_request(data)
performance_benchmark_response(rating)

// 8 Events
on('start-hosting')
on('repair-hosting')
on('end-hosting')
on('provide-proof-of-storage')
on('provide-performance-benchmark')
on('pause-plan')
on('resume-plan')
on('end-plan')
```


```js
// CHAIN
on('account_create', data => { })
on('account_update', data => { })
on('account_delete', data => { })
on('roles_register', data => { })
on('roles_unregister', data => { })
on('plan_subscribe', data => { })
on('plan_update', data => { })
on('plan_pause', data => { })
on('plan_resume', data => { })
on('plan_unsubscribe', data => { })
on('hosting_setup_report', (report) => { })
on('proof_of_storage_request', (data) => { })
on('proof_of_storage_response', (proof) => { })
on('performance_benchmark_request', (data) => { })
on('performance_benchmark_response', (rating) => { })

emit('start-hosting')
emit('repair-hosting')
emit('end-hosting')
emit('provide-proof-of-storage')
emit('provide-performance-benchmark')
emit('pause-plan')
emit('resume-plan')
emit('end-plan')
```