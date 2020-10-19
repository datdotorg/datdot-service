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
}
*/
const orders = []
/*
{ planID, feedID, set }
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

const attestorJobs = []
/*
{ fnName: 'makePerformanceChallenge', opts: contractID ) }
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

const unhostedPlans = [] // ids of unhosted plans
const hostedPlans = [] // when all contracts for certain plan are hosted => push planID to hostedPlans

const contractsEncoded = [] // IDs of contracts where encoding is confirmed
const contractsHosted = [] // IDs of contracts where hosting is confirmed

/*****************************************************************************/
const DB = {
  // state
  users,
  feeds,
  plans,
  orders,
  contracts,
  storageChallenges,
  performanceChallenges,
  // lookups
  userByAddress,
  feedByKey,
  // status
  idleHosters,
  idleEncoders,
  idleAttestors,
  unhostedPlans,
  hostedPlans,
  contractsEncoded,
  contractsHosted,
  attestorJobs
}
module.exports = DB
