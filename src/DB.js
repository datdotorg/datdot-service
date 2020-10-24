/******************************************************************************
  STATE
******************************************************************************/
const users = []
/*
{
  address: signer,
  attestorKey: Buff,
  encoderKey: Buff,
  hosterKey: Buff,
  attestorForm: {},
  encoderForm: {},
  hosterForm: {}
}
*/
const feeds = []
/*
{
  id: 1,
  publickey: 'key',
  meta: '{ signature, hashType, children }',
  status: 'unhosted'
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
plan: planID,
ranges: selectedPlan.ranges,
encoders: encoders.splice(0,3),
hosters: hosters.splice(0,3),
attestor: attestors.shift(),
activeHosters: []
}
*/

const storageChallenges = [] // Storage Proof
/*
{
  contract: 'contractID', // get hoster and feed from contract
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
/******************************************************************************
  LOOKUP
******************************************************************************/
const userByAddress = {} // address
const feedByKey = {
  // { key: id }
}

/******************************************************************************
  STATUS
******************************************************************************/
const idleHosters = [] // user ids
const idleEncoders = [] // user ids
const idleAttestors = [] // user ids
const draftContracts = [] // { planID, feedID, set }
const attestorJobs = [] //{ fnName: 'makePerformanceChallenge', opts: contractID ) }
const hostings = {} // userID: [contractID1, contractID2]
/*****************************************************************************/
const DB = {
  // state
  users,
  feeds,
  plans,
  draftContracts,
  contracts,
  hostings,
  storageChallenges,
  performanceChallenges,
  // lookups
  userByAddress,
  feedByKey,
  // status
  idleHosters,
  idleEncoders,
  idleAttestors,
  attestorJobs
}
module.exports = DB
