# Network Coordinates

```js


```

1. 8F + height (becasue custom user networks can be weird)
2. 20 sample adjustment term
3. 3 sample latency filter (moving average) correction
4. small gravity to keep coordinate system from moving
5. coordinate snapshopping onchain or nodes cache locally
6. ...still coordinate system might rotate

--------------------------------------------
CONSUL (for service discovery, monitoring, configuration, orchestration)
=> serf + raft (paxos) to sync?

Triangle Equality Violation

e.g. runs at 50k+ node scale
serf: what nodes are in our cluster
coordinates are pushed to central servers(chains?) every once in a while
servers(chains?) expose coordinates over APIs

-----------------------------------------
1. maybe switch sync mode from "steady state" to "recovery mode"
  * based on errors that start surfacing

  few errors: steady state, low sync overhead
  many errors: recovery mode, do more agressive syncing
  


# serf
* decentralized cluster membership
* failure detection (does a node die without notifying before they leave)
* orechestration (=deploy to X peers)

* gossip a profile
+ immutable simplified
+ fault tolerant + easy to operate (90% can fail, no problem, no problem with incredible churn of nodes)

- only eventual consistency (hard for users to wrap head around)
- no key/value config (
- no "central" API or UI


------------------------------------------------------------
1. measure local health
- tune sensitivity as health changes

2. exponential convergence
- replace fixed timers
- use redundant confirmations
- insight from bloom filters, k independent hashes

3. early notifications
- send suspicion early
  * more time to respond (multiple early follow ups)
- send suspicion redundant
- enable faster refute

// stop nodes from easily going around and claiming others are dead


# LIFE GUARD
1. user action
2. vault
3. audit log



# Few False Negatives vs. Few False Positives
1. "steady state" => few false negatives
  * 
2. "recover mode" => few false positives
  * 

run/observe logkeeper continuously and
1. define some "tests" (model)
2. or more advanced, learn the "model"


# Vault Advisor
* suggestions on a permission user dashboard?
