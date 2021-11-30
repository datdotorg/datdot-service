const host = require('./roles/hoster')
const encode = require('./roles/encoder.js')
const attest = require('./roles/attester.js')
const feed_store = require('_datdot-service-helpers/feed-store')

module.exports = datdot_service

/////////////////////////////////////////////////////////////////////////////////////////
module.exports = datdot_service_2
/////////////////////////////////////////////////////////////////////////////////////////
async function datdot_service_module (exclusive_keypair, vault) {
  // WE ARE THE APP DEVELOPER:
  // DEPENDENCIES:
  // const encode = require('./roles/encoder.js')
  // -------
  const host = require('./roles/hoster')
  const attest = require('./roles/attester.js')
  const networker = require('_datdot-service-helpers/networker2')

  // hyper://23r2j903jf9wuytp93ajg3498jyg934jt934jt9p3/funny-meme-app.js
  const helper3 = 'mafintosh/hypercore-protocol' // github
  const helper4 = 'hypercore' // npm
  const helper5 = '0x2439jf230jfqw93tjaqp3w9jrpa9q35' // hex feed key
  
  // const keypair = exclusive_keypair

  return datdot_service
  /////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////
  // TODO
  // go through hoster, attestor and encoder and see which logic repeats
  // make these repeating logic into functions and move them to service API
  // make hoster/encoder/attestor call servceAPI to execute this logic

  // TODO: given e.g. a feed address, offer helper features
  // => serviceAPI should offer feature to retrieve
  // => data required to submit to the chain to start a plan subscription
  async function datdot_service (profile, APIS) {
    const { log } = profile
    log({ type: '@todo', data: 'given e.g. a feed address, offer helper features' })

    const api = {
      host: host(APIS),
      attest: attest(APIS),
      encode_hosting_setup,
    }
    return api
    async function encode_hosting_setup () {
      // PROBLEM: the .use() app load api means, chain and service can never share a key
      // PROBLEM:
      // => service needs to
      // ---> sign with chain keypair
      // ---> or request that signature
      // ---> or maybe the service generates a key and gives public key to chain for registration
      // ----


      const hyperswarm = require('hyperswarm') // v0.0.1
      const swarm1 = new hyperswarm() // general
      const swarm2 = new hyperswarm() // many fresh ones

      // module.exports = funny_meme_app
      // async function funny_meme_app (/*...*/) {

      const kp1 = vault.keypair('foo')
      const kp2 = vault.keypair('bar')
      const kp3 = vault.keypair('swarm1')
      const swarm2 = new hyperswarm({ hosterKeypair: kp3 }) // intercepted

      const h1 = helper1()
      const h2 = helper2()
      const h3 = vault.use('hyperproto', helper3)
      const h4 = vault.use('appfeed', helper4)
      const h5 = vault.use('cool-feature', helper5)


      const h5 = vault.use('hyperswarm', 'hyperswarm/hyperswarm') // github
    }
  }
}
// ----
// hyper://0x2439jf230jfqw93tjaqp3w9jrpa9q35/cool-feature.js
module.exports = cool_feature
function cool_feature () {

}
// ----
// https://npmjs.org/package/hypercore/index.js
module.exports = hypercore
function hypercore () {

}
// ----
// https://github.com/mafintosh/hypercore-protocol/index.js
module.exports = hypercore_protocol
function hypercore_protocol () {

}
/////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////
/* -----------------------------------------
            Hosting setup
----------------------------------------- */

async function encode_hosting_setup (data, { store, log, keyPair }) {
  let stats = { ackCount: 0 }
  const {
    amendmentID,
    attestorKey,
    encoderKey,
    ranges, // = contract.ranges,
    encoder_pos,
    signatures,
    feedKey,
  } = data
  const log2Attestor = log.sub(`->Attestor ${attestorKey.toString('hex').substring(0,5)}`)
  const expectedChunkCount = getRangesCount(ranges)
  if (!Array.isArray(ranges)) ranges = [[ranges, ranges]]
  // --------------------------------------------------
  const stringkey = feedKey.toString('hex')
  // --------------------------------------------------

  // TODO: continue here:

  const feed = await store.load(`general/${stringkey}`, {
    type: 'general',
    data: {
      // extension: {
      //   ext_cbs,
      //   name
      // },
      swarm_opts: {
        topic: datdot_crypto.get_discoverykey(feedKey),
        mode: { server: false, client: true },
      },
      feedkey,
      peers,
    }
  })
  // return { feed, swarmID }





  const feed = await store.load(stringkey, { type: 'general', data: {/* ... */} })
  const feed = await store.load(stringkey, { type: 'general', data: {/* ... */} })
  const feed = await store.load(stringkey, { type: 'general', data: {/* ... */} })
  
  // const feed = await store.load(stringkey, { type: 'general', data: {/* ... */} })
  // const feed = await store.load(stringkey, { type: 'intercept', data: {/* ... */} })
  
  // const feed = await store.load(stringkey, { type: 'intercept', data: {/* ... */} })
  // const feed = await store.load(stringkey, { type: 'general', data: {/* ... */} })


  console.log(store.list())


  // store.load() // => type/key = value
  /*{
    general: [

    ],
    intercept: [

    ],
    fresh: [

    ],
  }*/
  

  // const feed = await store.load(`intercept/${stringkey}`, { type: 'intercept', data: {/* ... */} })

  const { publickey, secretkey } = keyPair.sub('feed')
  const feed = await store.load(`feed/${stringkey}`, { type: 'feed', data: {/* ... */} })
  

  // swarm_opts: { topic: datdot_crypto.get_discoverykey(feedKey),
  // mode: { server: false, client: true } },
  // feedkey: feedKey, 

  // if (stats.ackCount === expectedChunkCount) {
  //   await remove_task_from_cache({  feed, swarmID, log })
  //   resolve(`Encoded ${message.index} sent`)
  // }


  const feed = store.load('', { type: 'intercept', data: {/* ... */} })

  // const { feed, swarmID } = await store.start_task({
  //   extension: { ext_cbs: { onerror }, name: `datdot-hoster-${stringkey}` },
  //   swarm_opts: { 
  //     topic: datdot_crypto.get_discoverykey(feedKey), 
  //     mode: { server: false, client: true }, 
  //     keyPair: {}
  //   },
  //   feedkey: feedKey, 
  //   log
  // })
  // const opts = { keyPair: { publicKey: account.noisePublicKey, secretKey: account.noisePrivateKey } }


  // --------------------------------------------------


  return new Promise(async (resolve, reject) => {
    // if (!Array.isArray(ranges)) ranges = [[ranges, ranges]]
    // const { feed, swarmID } = await store.start_task({
    //   config: { intercept: false, fresh: false, persist: false },
    //   swarm_opts: { topic: datdot_crypto.get_discoverykey(feedKey), mode: { server: false, client: true } },
    //   feedkey: feedKey, 
    //   log
    // })
    // --------------------------------------------------  
    await hypercore_updated(feed, log)
    // create temp hypercore
    const core = toPromises(new hypercore(RAM, { valueEncoding: 'binary' }))
    await core.ready()







    
    // connect to attestor
    const topic = derive_topic({ senderKey: encoderKey, feedKey, receiverKey: attestorKey, id: amendmentID })

    const beam = new Hyperbeam(topic)
    
    // send the key and signature
    const temp_topic = topic + 'once'
    const beam_temp = new Hyperbeam(temp_topic)
    beam_temp.write(JSON.stringify({ type: 'feedkey', feedkey: core.key.toString('hex')}))
    // beam_temp.write(JSON.stringify({ type: 'feedkey', data: [core.key.toString('hex'), signature.toString('hex')] }))
    
    // pipe streams
    const coreStream = core.replicate(false, { live: true, ack: true })
    coreStream.pipe(beam).pipe(coreStream)
    coreStream.on('ack', ack => {
      log2Attestor({ type: 'encoder', data: [`ACK from attestor: chunk received`] })
      stats.ackCount++
    })

    var total = 0
    for (const range of ranges) total += (range[1] + 1) - range[0]
    log2Attestor({ type: 'encoder', data: [`Start encoding and sending data to attestor`] })
    for (const range of ranges) sendDataToAttestor({  core, range, feed, stats, signatures, amendmentID, encoder_pos, expectedChunkCount, log: log2Attestor })

    // HELPERS
    async function sendDataToAttestor ({  core, range, feed, stats, signatures, amendmentID, encoder_pos, expectedChunkCount, log }) {
      for (let index = range[0], len = range[1] + 1; index < len; index++) {
        log({ type: 'encoder', data: { text: 'Download index', index, range }})
        const msg = await download_and_encode( keyPair, index, feed, signatures, amendmentID, encoder_pos, log)
        send({  feedkey: feed.key, task_id: amendmentID, msg, core, log, stats, expectedChunkCount })
      }
    }
    async function send ({  feedkey, task_id, msg, core, stats, expectedChunkCount, log }) {
      const message = await msg
      await core.append(proof_codec.encode(message))
      log({ type: 'encoder', data: {  text:`MSG appended`, index: message.index, amendmentID } })
      if (stats.ackCount === expectedChunkCount) {
        log({ type: 'encoder', data: {  text:`All encoded sent`, amendmentID, index: message.index } })
        

        await remove_task_from_cache({  feed, swarmID, log })


        resolve(`Encoded ${message.index} sent`)
      }
    }
  })

  async function download_and_encode ( keyPair, index, feed, signatures, amendmentID, encoder_pos, log) {
    const data = await get_index(feed, index, log)
    const unique_el = `${amendmentID}/${encoder_pos}`
    const to_compress = serialize_before_compress(data, unique_el, log)
    log({ type: 'encoder', data: {  text: `Got data`, data: data.toString('hex'), index, to_compress: to_compress.toString('hex'), amendmentID }})
    const encoded_data = await brotli.compress(to_compress)

    const encoded_data_signature = await keyPair.sign(encoded_data)
    
    const keys = Object.keys(signatures)
    const indexes = keys.map(key => Number(key))
    const max = get_max_index(ranges)
    const version = indexes.find(v => v >= max)
    const nodes = await get_nodes(feed, index, version)
    return { type: 'proof', index, encoded_data, encoded_data_signature, nodes }
  }
}


// @NOTE:
// 1. encoded chunk has to be unique ([pos of encoder in the event, data]), so that hoster can not delete and download the encoded chunk from another hoster just in time
// 2. encoded chunk has to be signed by the original encoder so that the hoster cannot encode a chunk themselves and send it to attester
// 3. attestor verifies unique encoding data was signed by original encoder