/******************************************************************************
  STATE
******************************************************************************/
const users = []
/*
{
  address: signer
}
*/
const feeds = []
/*
{
  publickey: 'key',
  meta: '{ signature, hashType, children }',
  status: 'unhosted'
}
*/
const plans = []
/*
{
  feed: feedID,
  publisher: 'userID',
  ranges: [[0, 5], [7, 55]] // default [{0, feed.length}],
}
*/
const contracts = []
/*
{
  plan: planID,
  ranges: [ [0, 3], [5, 10] ],
  encoder: 'encoderID',
  hoster: 'hosterID'
}
*/
const challenges = [] // Proof of storage
/*
{
  contract: 'contractID', // get hoster and feed from contract
  chunks: [1,4,6]
}
*/
const attestations = [] // proof of retrievability
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
const feedByKey = {} //key
const plan = {} //
const contract = {} //
/******************************************************************************
  STATUS
******************************************************************************/
const idleHosters = [] // user ids
const idleEncoders = [] // user ids
const idleAttestors = [] // user ids

const unhostedPlans = [] // ids of unhosted plans
const hostedPlans = [] //when all contracts for certain plan are hosted => push planID to hostedPlans

const contractsEncoded = [] // IDs of contracts where encoding is confirmed
const contractsHosted = [] // IDs of contracts where hosting is confirmed


/////////////////////////////////////////////
const challenging = []
const challenge_reponses = []
/*
{
  challenge: 'challengeID',
  response: 'merkleProof'
}
*/

const attesting = []
const attestation_reponses = []
/*
{
  attestation: 'attestationID',
  response: {
    latency: 'foo',
    location: 'bar'
  }
}
*/
/*****************************************************************************/
const DB = {
  // state
  users,
  feeds,
  plans,
  contracts,
  challenges,
  attestations,
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
}
module.exports = DB
