/******************************************************************************
  STATE
******************************************************************************/
const users = []
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
  publisher: 'userID',
  ranges: [[0, 5], [7, 55]] // default [{0, feed.length}]
}
*/
const contracts = []
/*
{
  feed: 'feedID',
  ranges: [ [0, 3], [5, 10] ],
  encoder: 'encoderID',
  hoster: 'hosterID'
}
*/
const challenges = []
/*
{
  contract: 'contractID', // get hoster and feed from contract
  chunks: [1,4,6]
}
*/
const attestations = []
/*
{
  attestor: 'attestorID',
  contract: 'contractID',
  chunks: [1,4,6]
}
*/
/******************************************************************************
  LOOKUP
******************************************************************************/
const user = {}
const feed = {}
/******************************************************************************
  STATUS
******************************************************************************/
const hosters = []
const encoders = []
const attestors = []

const encoding = []
const encoded = []
const hosted = []

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
  users,
  feeds,
  plans,
  contracts,
  challenges,
  attestations,
  user,
  feed,
  hosters,
  encoders,
  attestors,
}
module.exports = DB
