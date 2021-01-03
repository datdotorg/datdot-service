# SERVICE

## HANDLERS
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

## HELPERS
```js
function _run (event) {

}
```
