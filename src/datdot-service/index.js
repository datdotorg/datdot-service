const SDK = require('dat-sdk')
const storage = require('random-access-memory')
const levelup = require('levelup')
const memdown = require('memdown')

const Encoder = require('src/encoder')
const Hoster = require('src/hoster')
const Hypercommunication = require('src/hypercommunication')
const EncoderDecoder = require('src/EncoderDecoder')

module.exports = datdotservice

function datdotservice (opts) {

  // { HosterStorage, profile } = opts

  const API = {
    encode,
    host,
    attest,
    solveChallenge,
    listen,
  }
  return API

  /* --------------------------------------
                ENCODE
  ----------------------------------------- */

  function encode (request, cb) {
    // get a request for encoding
    // const { feedkey, swarmkey, encoder_id, hoster_id, ranges } = request
    // check if feedkey exists => if yes, get merkleRoot (when updates)
    // connect to the original swarm and get the data for the requested ranges
    // encode the data
    // create custom swarmkey from encoder_id and hoster_id (example: 'datdot:encoder_id/hoster_id')
    // connect to the hoster (custom swarmkey)
    // SCENARIO A: encode, send merkleRoot, send data
      // and send the encoded data to the hoster
    // SCENARIO B: encode, send merkleRoot, but don't send data to the hoster (they will encode themselves)
      // dont't send any data to the hoster
    // call a callback with merkleRoot (has to match the ranges in the request)
    // if anything goes wrong, send cb with err
  }

/* --------------------------------------
              HOST
----------------------------------------- */

  function host (request, cb) {
    // get a request for encoding
    // const { feedkey, swarmkey, encoder_id, hoster_id} = request
    // join custom swarmkey to fetch encoded data
    // when all encoded data is downloaded, join the original swarm
    // if you receive request, decode data and send them to the peer
  }

  /* --------------------------------------
                ATTEST
  ----------------------------------------- */
  function attest (challenge, cb) {
    //
    const { chunkIndexes} = challenge
    const proof = []
    chunkIndexes.forEach(index => {
      proof.push(hosterStorage.getProofOfStorage(index))
    })
    cb(proof)
  }

  /* --------------------------------------
                SOLVE CHALLENGE
  ----------------------------------------- */
  function solveChallenge (challenge, cb) {
    // get a challenge
    // const { hosterID, planID, chunkIndexes} = challenge
    // send the requested encoded chunk to the chain
  }
  
  /* --------------------------------------
                LISTEN TO EVENTS
  ----------------------------------------- */
  const listen = { on, off, once }
  function on (query, callback) {

  }
  function off (query, callback) {

  }
  function once (query, callback) {

  }

}
