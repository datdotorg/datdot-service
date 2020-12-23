```js
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
  plan // publish, make contracts, make amendments
  => scheduleActionPriority // plan, contracts, amendments
  => PendingQueue
  => tryExecute
  => if success, schedule followup

  // const contract = { id, feedID, chunks, history: [37]... }
  // const entry =  { id: 37, type: 'job', data: { providers } }
  // contract.history.push({ type: 'job', data: { providers: { hosters: [2,7,6], encoder: [1,9,3], attestors: [12] } } })
  // contract.history.push({ type: 'cancel', data: { block: 77 } })
  // contract.history.push({ type: 'job', data: { providers: { hosters: [2] } } })


  // 1. sponsor     : publishes plan
  // 2. chain       : schedule ACTION to "execute plan" (`from: time` based)
  // 3. scheduler   : add plan ACTION to priority queue (`ratio` based)
  // 4. chain       : take highest priority items and execute (e.g. plan ACTION)          (see: tryNextAmendment)
  // 5. if plan     : EXECUTE "plan ACTION": split into sets of ranges, make contracts, add providers journal entry, emit job event
  // 6. if fail     : (no providers) => add contract ACTION to priority queue (`ratio` based)
  // ...
  // 7. chain       : take highest priority items and execute (e.g. contract ACTION)
  // 8. if contract : EXECUTE "contract ACTION": find providers, add journal entry, emit job event + (schedule FollowUp)

    scheduler // time based for things that need to happen for sure in the future => priority doest matter yet, so be lazy about it
    priority queue // ratio based, execute as many items from the front as possible, be eager about it
// ------------------------------------------------------------------------------
    async function plan_start (plan) {
      if (invalid({ plan })) return
      const id = await addItem(plan)
      const action = { type: 'calendar:execute_plan', data: id }
      const block = plan.from // `time` "block generator" (=clock)
      const entryID = calendar.schedule(block, action)
      // const plan = await getItem(id)
      plan.status = { schedule: entryID }
      await updateItem(id, plan)
      emitEvent('NewPlan', [id], log)
    }

    function plan_update (id, update) {
      const plan = await getItem(id)
      if (!plan) return
      if (invalid({ update })) return
      const new_plan = merge_plan_update(plan, update)
      await updateItem(id, new_plan)

      // CASE: scheduled
      const entryID = new_plan.status.schedule
      if (entryID) {
        if (new_plan.from !== plan.from) {
          const action = calendar.cancel(entryID)
          const block = new_plan.from
          const new_entryID = calendar.schedule(block, action)
          // const plan = await getItem(id)
          new_plan.status.schedule = new_entryID
          await updateItem(id, new_plan)
        }
      }

      // e.g. PLAN = 0-100 chunks => 10 contracts
      // 1: 0-9
      // 2: 10-19
      // ...
      // => 1. schedule plan
      // => 2. on time: add to prio queue
      // => 3. on prio: make contracts + start hosting

      // => made and added to priority queue or even hosted because plan.from triggered at scheduled time

      // scnarios: => UPDATE PLAN:
      // 1. only time changed


      // 2. only ranges changed


      // 3. both changed


      // CASE: priority queued
      else if (new_plan.from !== plan.from) {
        // REMOVE OLD:
        // CASE: pending plan (=priority queue)
        const dropped = queue.drop([id])
        // CASE: pending contracts (=priority queue)
        if (!dropped) queue.drop(new_plan.contracts)
      }

      // CASE: hosted
      else {


      }

      makeContractsAndScheduleAmendments({ plan }, log) // schedule the plan execution
    }
    function plan_stop (plan) {

            calendar.cancel(actionID)

            const { scheduleAction, cancelAction } = await scheduler
    }

```
