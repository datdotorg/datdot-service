# PERFORMANCE BENCHMARK CONCEPT
HOSTER_CONTEXT (PEERS):
* hoster peer stores set of chunks per hosting contract
* hoster joins a swarm per hosting contract
* hoster might run cpu heavy programs on their computer
```js
* hoster hosts data for their region and foreign regions
* hoster peer is connected to lots of leechers
// ----------------------------------------------------------------------------
PERFORMANCE_MEASURING (RAW vs WORKING vs OFF_CHAIN)
// ----------------------------------------------------------------------------
OFF_CHAIN (via UI/CLI only) (e.g. sponsor can use this)
1. SWARM_HEALTH: // measure overall health of certain hosted sets of a specific hosted feed
  * user calculates swarm health for their own interest
2. peer/role raw working performance (e.g. encoding, attesting, hosting, ...)
  * measure `performance requirements` for single job
  `ENCODER`
    how long does the job take
    resources needed
  `ATTESTOR`
    [ 'contract', 'proof_of_storage', 'performance_benchmark' ].forEach
    how long does the job take
    resources needed
  `HOSTER`
    - how long does the contract job take
    - resources needed for contract job
    - resources needed for storing job
    - resources needed for serving data
        - 0 peers in swarm
        - 1-10
        - 11-50
        - over 50
    - resources needed for proof-of-storage challenge
    - resources needed for performance benchmark
// ----------------------------------------------------------------------------
RAW (when users register for a role):
1. peer/role raw idle performance
  * attestor requests data from *the peer* and measures: `{ latency, bandwidth: {egress} }`
  // 1. benchmarked when they first register
  // 2. chain requests raw performance check if working performance changes
  // 3. self report updates (triggered by users themselves)
  //   * when they change hardware
  //   * when they change location
  //   * ...

// ----------------------------------------------------------------------------
WORKING_PERFORMANCE (by PEERS to PEERS):
https://discord.com/channels/709519409932140575/709522119335346196/788226046012817478
1. SWARM_BUSYNESS:
  * attestor announces to have the data and counts `incoming requests` for hosted feed ranges
  * harvest requests with ranges from the hosting contract
    - `feed.peers` shows all peers you are connected to (configure to very large number to see all)
    - announce yourself
    - `want messages` of feed.peers are in the replicator
      * but beware they are for big ranges
      ie want` 0->100k`
    - to see blocks you are serving to others, you can use the `upload event` on the hypercore
    - wait for request, then disconnect
    - repeat until x requests

2. HOSTER_PERFORMANCE:
  * attestor requests data from *the hosters* and measures: `{ latency, bandwidth: {egress} }`
  2. listen to extension messages and disconnect from all who are not hosters
  3. request chunks (mimic the harvested requests)
    peers.forEach(peer => request(peer, index))
    - `hypercore/replicate.js` add `request(peer, index)` to request data from certain peer


// ----------------------------------------------------------------------------
REPORTING (by PEERS to CHAIN):
- hosters to self report the `{ bandwidth: {ingress, egress} }` for hosting they are using
  * (in terms of chunks and bytes)
  * on a regular basis?
  * or when asked?

// REPORTING:
  // resource usage
  // infrastructure/application availability

// capacity management
  // => determine projected workload
  // => measure how changes in hardware affect application performance
  // => incentivize resources to join/leave
  // e.g. if we give one more job, how does it affect given on their hardware

  // what is baseline performance (raw + idle)
  // how changes in hardware will affect performance
  // determine resources needed for certain workload

// compliance management
  // commit to SLA (service level aggreements)
  // document KPI data to document compliance to a promised service level
  // => helps answer questions like:
  // 1. what percentage of time are services available
  // 2. how are the services performing
  // 3. what are root causes of outages & degredation of performance
  // => conclusion:
  //   1. targeted alerts: (threshold to trigger actions)
  //   * e.g. min/max/average values for expected performance



  // process monitoring (=datdot process?)
  // JOB scripts/services monitoring (=processed jobs?)
  // event log monitoring (=evaluate and trigger alert tasks on chain)
  // FEED url/files/folders monitoring (=swarm/feed hostings monitoring)

// general host and server monitoring
  CPU ({
    active_jobs, // process_count, thread_count,
    %interrupt_time,
    %privilege_time,
    %processor_time,
    %user_time,
  })
  MEM ({
    (total_physical_memory),
    free memory,
    page faults per second,
    page reads per second,
    page writes per second,
    pages output per second,
    pool non paged bytes,
    pool pages bytes,
  })
  HDD ({
    disk free%,
    disk free space,
    disk reads per second,
    disk writes per second,
    disk read bytes per second,
    disk write bytes per second,
    disk transfers per second,
  })
  NET ({ // + process utilization?
    output queue length,
    packets outbound errors,
    packets received errors,
    kilobytes received per second,
    kilobytes sent per second,    
  })

  `{ cpu(s), gpu(s), mem/ram, hdd, net: { egress, ingress, latency } }`

  * REPORT: per contract (set of chunks) the used: `{ bandwidth: {ingress, egress}}`
  * REPORT: the requested chunk indexes
  * REPORT: the times each index was requested
  * REPORT: the data size of each chunk

  * e.g.
    * 5x i=1(64kb)
    * 10x i=232(70kb)
    * 12x i=120(50kb)
    * ...






- attestor reports `{ hosting_health, swarm_busyness, hoster_performances }`
// ----------------------------------------------------------------------------
VERIFYING (by PEERS and/or CHAIN):
// for all measurements to make sure they are high quality
// e.g. for self reporting
//



// ----------------------------------------------------------------------------
EVALUATING_AND_SAVE (by CHAIN):
- comparing the self reports for a particular hosting of all 3 hosters
  * _feed_upload: `bandwidth: {ingress, egress}`
  * _incoming_requests: ???
- compare attestor reports `hoster_performances` reported
  * by region (e.g. EUROPE attestor, AFRIKA attestor, ASIA Attestor)
//   * compare how many times in X cases do we get a response from a certain hoster?
//     * example (50 request): 29x unknown peer, 10x hosterA, 9x hosterB, 2x hosterC (send hoster extension msg)

// Benchmark to Sponsors Requirements:
//   * can we get certain chunk when we request it (no matter which peer provides it)?
//   * can we get data under required latency?
//   * can we get a lot of data in the required time? (bandwidth test)
// ----------------------------------------------------------------------------
RANKING:
* example (one performance): hosterA > hosterB > hosterC (all 3 hosters per performance for given a 10-chunk-contract)
* example (performance history): hosterA(#1=25%,#2=25%,#3=50%)
* example (cross sets performance): hosterA(#1=15%,#2=75%,#3=10%)
* if hosters get paid for the service quality they offer
  * => a better paid hoster should rank higher than a worse paid hoster
// ----------------------------------------------------------------------------
LOAD_AND_USE (by CHAIN):
const bool = doesQualify(hosterID, jobID)
function doesQualify (hosterID, jobID) {
  // for loop: hoster.measured_by_attestors[i]

  // hosters have lower performance in "foreign regions" but want to get paid what? ...
  // => can hosters configure if they want to be selected for "foreign regions"?
  //   * (e.g. because not enough jobs at home?)
}
```
