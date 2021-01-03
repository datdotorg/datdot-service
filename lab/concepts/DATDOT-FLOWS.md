# DATDOT FLOWS

## 1. PUBLIC API (EXTRINSICS + EVENTS)
[CHAIN](./chain_actions/README.md)
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

## 2. CHAIN: EXECUTE LOOP (TASKS => ACTIONS => (HELPERS) => EMITS => ... => TASKS)
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

## 3. SERVICE: EXECUTE LOOP: (CHAIN API => ... => EVENTS => HANDLERS => (HELPERS) => CHAIN API)
[SERVICE](./service_handlers/README.md)
```js
const service = {
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
chain.on('start-hosting', service['start_hosting'])
chain.hosting_setup_report()
chain.plan_update()
// _hosting_repair()
chain.on('repair-hosting', service['repair_hosting'])
// _hosting_end()
chain.on('end-hosting', service['end_hosting'])
chain.proof_of_storage_request()
chain.on('provide-proof-of-storage', service['provide_proof_of_storage'])
chain.proof_of_storage_response()
chain.performance_benchmark_request()
chain.on('provide-performance-benchmark', service['provide_performance_benchmark'])
chain.performance_benchmark_response()
chain.plan_pause()
chain.on('pause-plan', service['pause_plan'])
chain.plan_resume()
chain.on('resume-plan', service['resume_plan'])
chain.plan_unsubscribe()
chain.on('end-plan', service['end_plan'])
chain.roles_unregister()
chain.account_delete()
```
