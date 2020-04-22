const storage = require('random-access-memory')
const levelup = require('levelup')
const memdown = require('memdown')

const Encoder = require('src/encoder')
const Hoster = require('src/hoster')
const Hypercommunication = require('src/hypercommunication')
const EncoderDecoder = require('src/EncoderDecoder')

const Hypercore = require('hypercore')
const hyperswarm = require('hyperswarm')
const ram = require('random-access-memory')
const reallyReady = require('hypercore-really-ready')

module.exports = datdotservice

function datdotservice (opts) {
  // { HosterStorage, profile } = opts

  // initialize encoder
  const encoderSDK = await SDK({ storage })
  const encoderCommunication = await Hypercommunication.create({ sdk: encoderSDK })
  const encoder = await Encoder.load({
    EncoderDecoder,
    communication: encoderCommunication,
    sdk: encoderSDK
  })

  // initialize hoster
  const hosterSDK = await SDK({ storage })
  const hosterCommunication = await Hypercommunication.create({ sdk: hosterSDK })
  const hosterDB = levelup(memdown())
  const hoster = await Hoster.load({
    EncoderDecoder,
    db: hosterDB,
    sdk: hosterSDK,
    communication: hosterCommunication,
    onNeedsEncoding: //async (key, index) => chain.requestEncoding(hosterCommunication.publicKey, key, index)
  })


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

  function encode (request, done) {

    // get a request for encoding
    const { feedkey, ranges } = request
    const hoster = hosterCommunication.publicKey
    // connect to the original swarm
    // create custom swarmkey from encoder_id and hoster_id (example: 'datdot:encoder_id/hoster_id')
    // connect to the hoster (custom swarmkey)

    // loop over ranges
    // get the data for index in range
    // get the merkle proof for index in range
    // encode the data
    // sign the data
    // send data to hoster
    // data = encoded chunk + signature + merkle proof
    await encoder.encodeFor(hoster, feedkey, ranges)

    // call cb, if anything goes wrong, send cb with err
    done()
  }


/* --------------------------------------
              HOST
----------------------------------------- */

  function host (request, cb) {
    const {feedkey, plan} = request
    // get a request for hosting
    await this.hoster.addFeed(feedkey, plan)
    // download merkleRoot from chain
    // connect to the encoder (custom swarmkey)
    // listen for disconnect/timeout of encoder
      // on timeout/disconnect => save PROGRESS
      // cb('encoder time out', encoder => {
      //   ...resume LOOP but only for remaining chunks (see progress)
      // })
    // loop
      // get the chunk
      // take pubkey from encoder and check if signature is valid
      // decompress chunk
      // compare chunk & merkle proof to original merkleRoot
      // store to levelDB

    // join original swarm & start seeding
    // call cb, if anything goes wrong, send cb with err
      // cb('wrong encoded data')
    cb()
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
