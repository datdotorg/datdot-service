# FLOWS


## 1. PUBLIC API (EXTRINSICS + EVENTS)
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

on('start-hosting')
on('repair-hosting')
on('end-hosting')

on('provide-proof-of-storage')
on('provide-performance-benchmark')

on('pause-plan')
on('resume-plan')
on('end-plan')
```

## 2. EXECUTE CHAIN LOOP: (TASKS => ACTIONS => (HELPERS) => EMITS => ... => TASKS)
1. a network of many nodes
2. user makes transaction in frontned and sends it to their node

3. node receives an "pending extrinsic"
4. broadcasts to the rest of the network
5. those are received by other nodes

4. block producer(s) are selected
5. extrinsics are added block
6. blocks are sent out to all nodes
7. when they receive it they execute the blocks extrinsics them and mutate/add them to their nodes state
8. ...start over...

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
  if (type === 'queue:execute_plan') _execute_plan(id)
  // @TODO: make this more detailed
}
```

### CHAIN ACTIONS
```js
// ACTIONS
function _execute_plan () {}
```

### CHAIN HELPERS
```js
function _merge_plan_update () {}
function _hosting_start () {}
function _hosting_repair () {}
function _hosting_end () {}
```

## 3. EXECUTE SERVICE LOOP: (CHAIN API => ... => EVENTS => HANDLERS => (HELPERS) => CHAIN API)
```js
const handlers = {
  start_hosting,
  repair_hosting,
  end_hosting,
  provide_proof_of_storage,
  provide_performance_benchmark,
  pause_plan,
  resume_plan,
  end_plan,
}

chain.account_create()
chain.account_update()
chain.roles_register()
chain.plan_subscribe()
// _hosting_start()
on('start-hosting', handlers['start_hosting'])
chain.hosting_setup_report()
chain.plan_update()
// _hosting_repair()
on('repair-hosting', handlers['repair_hosting'])
// _hosting_end()
on('end-hosting', handlers['end_hosting'])
chain.proof_of_storage_request()
on('provide-proof-of-storage', handlers['provide_proof_of_storage'])
chain.proof_of_storage_response()
chain.performance_benchmark_request()
on('provide-performance-benchmark', handlers['provide_performance_benchmark'])
chain.performance_benchmark_response()
chain.plan_pause()
on('pause-plan', handlers['pause_plan'])
chain.plan_resume()
on('resume-plan', handlers['resume_plan'])
chain.plan_unsubscribe()
on('end-plan', handlers['end_plan'])
chain.roles_unregister()
chain.account_delete()
```

### SERVICE HANDLERS
```js
// HANDLERS
function start_hosting (event) {
  const id_start = setTimeout(() => _hosting_default_report(), 5000)
  setTimeout(() => {
    chain.hosting_setup_report()
    cancelTimeout(id_start)
  }, _run(event))
  // e.g. start a new feed ranges contract
  // e.g. a hoster/encoder/attestor failed (now or later) and we need to issue a new event to replace them
  // e.g. a hoster/encoder/attestor unregistered (=stopped offering a service), so => order replacement
  // e.g. maybe sponsor updates their plan
  // e.g. maybe an `attestor` in the swarm notices new feed chuncks in a feed and notifies the chain about it so hosting is updated
}
function repair_hosting (event) {
  const id_start = setTimeout(() => _hosting_default_report(), 5000)
  setTimeout(() => {
    chain.hosting_setup_report()
    cancelTimeout(id_start)
  }, _run(event))
  // e.g. start a new feed ranges contract
  // e.g. a hoster/encoder/attestor failed (now or later) and we need to issue a new event to replace them
  // e.g. a hoster/encoder/attestor unregistered (=stopped offering a service), so => order replacement
  // e.g. maybe sponsor updates their plan
  // e.g. maybe an `attestor` in the swarm notices new feed chuncks in a feed and notifies the chain about it so hosting is updated
}
function end_hosting (event) {
  _run(event)
  // e.g. start a new feed ranges contract
  // e.g. a hoster/encoder/attestor failed (now or later) and we need to issue a new event to replace them
  // e.g. a hoster/encoder/attestor unregistered (=stopped offering a service), so => order replacement
  // e.g. maybe sponsor updates their plan
  // e.g. maybe an `attestor` in the swarm notices new feed chuncks in a feed and notifies the chain about it so hosting is updated
}
function provide_proof_of_storage (event) {
  const id_pos = setTimeout(() => proof_of_storage_default(), 5000)
  setTimeout(() => {
    chain.proof_of_storage_response(proof)
    cancelTimeout(id_pos)
  }, _run(event))
}
function provide_performance_benchmark (event) {
  const id_pop = setTimeout(() => performance_benchmark_default(), 5000)
  setTimeout(() => {
    chain.performance_benchmark_response(rating)
    cancelTimeout(id_pop)
  }, _run(event))
  //
}
function pause_plan (event) {
  _run(event)
  // plan was paused by sponsor
  // temporary exit swarms for feed to not serve or do perf challenges
}
function resume_plan (event) {
  _run(event)
  // plan was resumed by sponsor
  // re-enter swarms for feed to not serve or do perf challenges
}
function end_plan (event) {
  _run(event)
  // e.g. plan is completed
  // e.g. plan was canceled by sponsor
  // exit all swarms and delete feed data permanently  
}
```

### SERVICE HELPERS
```js
function _run (event) {

}
```
