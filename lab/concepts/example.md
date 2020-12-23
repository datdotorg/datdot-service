```js

  on('account_create', data => {

  })
  on('account_update', data => {

  })
  on('account_delete', data => {

  })
  on('roles_register', data => {

  })
  on('roles_unregister', data => {

  })
  on('plan_subscribe', data => {

  })
  on('plan_update', data => {

  })
  on('plan_pause', data => {

  })
  on('plan_resume', data => {

  })
  on('plan_unsubscribe', data => {

  })
  on('hosting_setup_report', (report) => {

  })
  on('proof_of_storage_request', (data) => {

  })
  on('proof_of_storage_response', (proof) => {

  })
  on('performance_benchmark_request', (data) => {

  })
  on('performance_benchmark_response', (rating) => {

  })


  db.addAction({
    'roles_unregister': data => {

    }

  })
  db.addEmitter({
    name: 'roles_unregister',
    match: (type, path, value) => {},
    get_data: (path, value) => {},
  })


  on('roles_unregister', data => {

  })

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
