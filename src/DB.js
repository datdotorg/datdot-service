/******************************************************************************
  STATE
******************************************************************************/
const users = []
/*
{
  id, 776
  address: signer,
  hoster: {
    key, form, capacity, idleStorage, jobs
  }
  encoder: {
    key, form, capacity, idleStorage, jobs
  }
  attestor: {
    key, form, capacity, idleStorage, jobs
  }
}
*/

const feeds = []
/*
{
  id: 1,
  publickey: 'key',
  meta: '{ signature, hashType, children }',
  status: 'unhosted',
  publisher
}
*/
const plans = []
/*
{
  feed: feedID,
  sponsor: 'userID',
  ranges: [[0, 5], [7, 55]] // default [{0, feed.length}],
  contracts: []
}
*/
const contracts = []
/*
{
id,
feed,
plan: planID,
ranges: selectedPlan.ranges,
activeHosters: [],
amendments: [],
status: {
  schedulerID: integer
}
}
*/

const amendments = []
/*
{
id,
contract: contractID,
providers: {
  encoders,
  hosters,
  attestors,
},
}
*/
const storageChallenges = [] // Storage Proof
/*
{
  contract: 'contractID',
  hoster,
  chunks: [1,4,6]
}
*/

const performanceChallenges = [] // Performance Proof
/*
{
  attestor: 'attestorID',
  contract: 'contractID'
}

*/
const failedJobs = {
  /*
  userID: [{ type: 'contract', id: 17},{ type: 'amendment', id: 6}]
  */
}
/******************************************************************************
  LOOKUP
******************************************************************************/
const userByAddress = {} // address
const feedByKey = {
  // { key: id }
}
const userIDByKey = {}

/******************************************************************************
  STATUS
******************************************************************************/
const idleHosters = [] // user ids
const idleEncoders = [] // user ids
const idleAttestors = [] // user ids
const pendingAmendments = [] // { planID, feedID, set }
const attestorsJobQueue = [] //{ fnName: 'makePerformanceChallenge', opts: contractID ) }
const hostings = {} // userID: [contractID1, contractID2]
/*****************************************************************************/
const DB = {
  // state
  users,
  feeds,
  plans,
  pendingAmendments,
  contracts,
  amendments,
  hostings,
  storageChallenges,
  performanceChallenges,
  // lookups
  userByAddress,
  userIDByKey,
  feedByKey,
  // status
  idleHosters,
  idleEncoders,
  idleAttestors,
  attestorsJobQueue
}
module.exports = DB
