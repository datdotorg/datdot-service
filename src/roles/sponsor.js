const dateToBlockNumber = require('../dateToBlockNumber')
/******************************************************************************
  ROLE: sponsor
******************************************************************************/

module.exports = role

async function role (profile, APIS) {
  const { name, log } = profile
  const { serviceAPI, chainAPI, vaultAPI } = APIS

  log({ type: 'sponsor', body: [`I am a sponsor`] })
  await chainAPI.listenToEvents(handleEvent)
  const myAddress = vaultAPI.chainKeypair.address
  log({ type: 'sponsor', body: [`My address ${myAddress}`] })
  const signer = vaultAPI.chainKeypair

  // EVENTS
  async function handleEvent (event) {
    if (event.method === 'FeedPublished') {
      const [feedID] = event.data
      log({ type: 'chainEvent', body: [`Event received: ${event.method} ${event.data.toString()}`] })

      const nonce = await vaultAPI.getNonce()
      const feed1 = { id: feedID, ranges: [[0,3], [5,8], [10,14]] }
      const feeds = [feed1 /*, ... */]
      const blockNow = await chainAPI.getBlockNumber()
      const until = new Date('Nov 26, 2021 23:55:00')
      const untilBlock = dateToBlockNumber ({ dateNow: new Date(), blockNow, date: until })
      const plan = makePlan({ feeds, blockNow, untilBlock })
      await chainAPI.publishPlan({ plan, signer, nonce })
    }
    if (event.method === 'StorageChallengeConfirmed') {
      const [storageChallengeID] = event.data
      const { contract: contractID } = await chainAPI.getStorageChallengeByID(storageChallengeID)
      const { plan: planID } = await chainAPI.getContractByID(contractID)
      const { sponsor: sponsorID } = await chainAPI.getPlanByID(planID)
      const sponsorAddress = await chainAPI.getUserAddress(sponsorID)
      if (sponsorAddress === myAddress) {
        log({ type: 'chainEvent', body: [`Event received: ${event.method} ${event.data.toString()}`] })
      }
    }
    if (event.method === 'PerformanceChallengeConfirmed') {
      const [performanceChallengeID] = event.data
      const { contract: contractID } = await chainAPI.getPerformanceChallengeByID(performanceChallengeID)
      const { plan: planID } = await chainAPI.getContractByID(contractID)
      const { sponsor: sponsorID } = await chainAPI.getPlanByID(planID)
      const sponsorAddress = await chainAPI.getUserAddress(sponsorID)
      if (sponsorAddress === myAddress) {
        // log({ type: 'chainEvent', body: [`Event received: ${event.method} ${event.data.toString()}`] })
        log({ type: 'chainEvent', body: [`Event received: ${event.method} ${event.data.toString()}`] })

      }
    }
  }

  // HELPERS
 // See example https://pastebin.com/5nAb6XHQ
 // all feeds under one Plan have same hosting settings
 function sponsorPlan () {
   const sponsorship = {
     planID,
     importance : '', // 1-3? 1-10?
     budget     : '',
     traffic    : '',
     price      : '',
   }
   return { type: 'start', data: sponsorship }
 }
 function updateSponsorship () {
   return { type: 'pause', data: id }
   return { type: 'resume', data: id }
   return { type: 'cancel', data: id }
   return { type: 'update', data: { id, update: { importance, budget } } }

    if ( type === 'update') sponsorships[data.id] = Object.assign(sponsorships[data.id], data.update)
 }
  function makePlan ({ feeds, blockNow, untilBlock }) {
    const feeds = [feed_id0, feed_pk1, feed_pk2, feed_id2]
    const dataset = [{ id, ranges }]
    const performances = [{ // OPTIONAL
      availability: '', // percentage_decimal
      bandwidth: { /*'speed', 'guarantee'*/ }, // bitspersecond, percentage_decimal
      latency: { /*'lag', 'guarantee'*/ }, // milliseconds, percentage_decimal
    }],
    const timetable = [{ // OPTIONAL
      delay    : '', // milliseconds // default: 0
      duration : '', // milliseconds // default: until - from
      pause    : '', // milliseconds // default: none
      repeat   : '', // number // default: none
    }],
    const regions = [['X3F', 'A0K']],  // at least 1 region is mandatory (defaults to global)
    // @TODO should times be converted into blocks??
    return {
      components: { feeds, dataset, performance, timetable, regions },
      from     : blockNow, // or new Date('Apr 30, 2000')
      until    : untilBlock, // date
      program  : [
        { plans: [234] },
        {
          // @TODO: if you publish a few local components (e.g. 5)
          // and you want to reference the global component with id=3
          // how to figure out if thats local ID or global ID
          // e.g. positive vs. negative numbers to differentiate
          dataset, // [0, 1]
          regions, // [0, 1]
          timetable, // [0]
          performance: 0,
        },
        { dataset, regions, performance, times },
        { dataset, regions, performance, times }
      ]
    }
  }
  function makePlanUpdate ({ }) {
    // - pause plan (define max, after that resume or drop) - maybe pause only performance challenges
    //   -> hosters can pause seeding and dont get paid for seeding, only storing,  while paused
    // ...
    const { program: { add, del, put } } = plan
    Object.entries(put).map(([i, val]) => Object.assign(program[i], val))
    del.map(i, => program.splice(i, 1))
    program.push(...add)

    return {
      id,
      components,
      from,
      until,
      program: {
        add: [{ dataset, regions, performance, timetable }, { plans: [33] }],
        del: [0],
        put: {2: { dataset, regions }},
      }
    }
  }

}
