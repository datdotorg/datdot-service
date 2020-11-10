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
providers: {
  encoders,
  hosters,
  attestor,
  activeHosters,
  failedHosters
},
updates: []
}
*/

const amendments = []
/*
{
contract: contractID,
providers: {
  hosters,
  encoders,
  attestor,
  hostersAsEncoders
}
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
/******************************************************************************
  LOOKUP
******************************************************************************/
const userByAddress = {} // address
const feedByKey = {
  // { key: id }
}
const userByHosterKey = {}

/******************************************************************************
  STATUS
******************************************************************************/
const idleHosters = [] // user ids
const idleEncoders = [] // user ids
const idleAttestors = [] // user ids
const contractJobsQueue = [] // { planID, feedID, set }
const attestorsJobQueue = [] //{ fnName: 'makePerformanceChallenge', opts: contractID ) }
const hostings = {} // userID: [contractID1, contractID2]
/*****************************************************************************/
const DB = {
  // state
  users,
  feeds,
  plans,
  contractJobsQueue,
  contracts,
  amendments,
  hostings,
  storageChallenges,
  performanceChallenges,
  // lookups
  userByAddress,
  userByHosterKey,
  feedByKey,
  // status
  idleHosters,
  idleEncoders,
  idleAttestors,
  attestorsJobQueue
}
module.exports = DB
