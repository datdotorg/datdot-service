const { Keyring } = require('@polkadot/api')
const { cryptoWaitReady } = require('@polkadot/util-crypto')
const keyring = new Keyring({ type: 'sr25519' })
const getData = require('../../src/getHypercoreData')
const getChainAPI = require('../../src/chainAPI') // to use substrate node
const SDK = require('dat-sdk')
const storage = require('random-access-memory')
// const storage = './tmp'
const levelup = require('levelup')
const memdown = require('memdown')

const colors = require('colors/safe')
const NAME = __filename.split('/').pop().split('.')[0].toUpperCase()
function LOG (...msgs) {
  msgs = [`[${NAME}] `, ...msgs].map(msg => colors.green(msg))
  console.log(...msgs)
}

/*
1. publish data
2. wait for SomethingStored event
3. then register users for different roles: encoder, hoster, attestor
4. When hoster registers, they automatically get automatically selected to host random published data
5. new event is emited (NewPin) where encoder and hoster are notified about what feed needs hosting/encoding
6. we pair hoster and encoder: encoder compresses data and passes them over to hoster
7. when encoder finishes its job, it notifies the chain (registerEncoding)
8. when hoster gets all the data, it also notifies the chain (confirmHosting)
9. chain emits event: HostingStarted
10. Publisher can now submitChallenge
11. Challenge event is emited where hoster is notified about the challenges
12. Hoster submits proof to the chain
13. If challenges are successful, chain emits new event: AttestPhase
14. random attester is selected to go grab data from the swarm
15. Attester reports back to the chain (submitAttestation)
*/

/* --------------------------------------
              A. SETUP FLOW
----------------------------------------- */

// 1. Get substrate chain API
async function setup () {
  await cryptoWaitReady();
  const chainAPI = await getChainAPI()
  const serviceAPI = {}
  const names = ['//Alice', '//Charlie', '//Ferdie', '//Eve', '//Dave']
  const accounts = []
  for (var i = 0; i < names.length; i++) {
    const name = names[i]
    const account = makeAccount(name)
    accounts.push(account)
    account.name = name.split('//')[1]
    LOG(name, account.address)
  }
  if (names.length === accounts.length) start(chainAPI, serviceAPI, accounts)
}
setup()

// 2. `make ACCOUNT`
function makeAccount (name) {
  return keyring.addFromUri(name)
}

async function start (chainAPI, serviceAPI, accounts) {
  /* --------------------------------------
            B. COMMIT FLOW
  ----------------------------------------- */
  // 1. `publish DATA`
  async function registerData () {
    const data = await getData
    const opts = {
      merkleRoot: data,
      account: accounts[0]
    }
    await chainAPI.registerData(opts)
  }
  // registerEncoder()
  // registerAttestor()
  // registerHoster()
  registerData()
  chainAPI.listenToEvents(handleEvent)

  /* --------------------------------------
        C. REGISTERING FLOW
  ----------------------------------------- */
  async function registerHoster () {
    const account = accounts[2]
	  await chainAPI.registerHoster({account})
  }

  async function registerEncoder () {
    const account = accounts[3]
    await chainAPI.registerEncoder({ account })
  }
  async function registerAttestor () {
    const account = accounts[1]
    await chainAPI.registerAttestor({ account })
  }
  /* --------------------------------------
            D. SERVICE FLOW
  ----------------------------------------- */

  async function requestHosting (data) {
    LOG('Request Hosting event data')
    const [encoderID, hosterID, datID] = data
    // const { archive_pubkey, archive_size } = await chainAPI.getArchive(datID)
    const { archive_pubkey, archive_size } = await chainAPI.getArchive(datID)
    LOG('Archive size', archive_size )
    var { address: hosterKey, publicKey: hosterPublicKey } = await chainAPI.getUser(hosterID)
    var { address: encoderKey, publicKey: encoderPublicKey } = await chainAPI.getUser(encoderID)

    hosterKey = Buffer.from(hosterKey)
    encoderKey = Buffer.from(encoderKey)


    LOG('@TODO: check mauves code')
    /// Mauve's code
    const plan = {
      ranges: [{ start: 0, end: 1 }],
      watch: true
    }
    LOG('Publisher requested hosting for', archive_pubkey)
    LOG('Pairing hoster and encoder', hosterKey, encoderKey)
    const Encoder = require('../../src/encoder')
    const Hoster = require('../../src/hoster')
    const EncoderDecoder = require('../../src/EncoderDecoder')

    const encoderSDK = await SDK({ storage })
    const encoder = await Encoder.load({ EncoderDecoder, sdk: encoderSDK })

    const hosterSDK = await SDK({ storage })
    const hosterDB = levelup(memdown())
    const hoster = await Hoster.load({ EncoderDecoder, db: hosterDB, sdk: hosterSDK })

    const activateHoster = hoster.addFeed(archive_pubkey, encoderKey, plan)
    activateHoster.then(() => {
      LOG('Hosting succesfull')
      const opts = {account: hosterKey, archive: datID, index} // (HostedMap.encoded[index])
      chainAPI.confirmHosting(opts)
    })
    const activateEncoder = await encoder.encodeFor(hosterKey, archive_pubkey, plan)
    activateEncoder.then(() => {
      LOG('Encoding succesfull')
      // registerEncoding for each range
      plan.ranges.forEach(range => {
        const opts = {
          account: encoderKey,
          hosterID,
          datID,
          start: range.start,
          end: range.end}
        chainAPI.registerEncoding(opts)
      })
    })

    // end of Mauve's code
  }


  let signer = 0
  async function submitChallenge (data) { // submitChallenge
    const [userID, feedID ] = data
    const opts = { account: accounts[signer], userID, feedID }
    signer <= accounts.length - 1 ? signer++ : signer = 0
    await chainAPI.submitChallenge(opts)
  }

  // async function getChallenges (data) {
  //   // data should be now (selected_user_key, dat_pubkey)
  //   const user = data[0]
  //   const opts = { user, accounts, respondToChallenges }
  //   const responses = await chainAPI.getChallenges(opts)
  //   await respondToChallenges(responses)
  // }
  //
  // async function respondToChallenges (responses) {
  //   const feeds = (await getData)[1]
  //   const opts = { responses, feeds, keyring }
  //   await chainAPI.submitProof(opts)
  // }

  async function submitProof (data) {
    await chainAPI.submitProof({ data, accounts })
  }

  async function attestPhase (data) {
    LOG('Attest phase event data', data.toString('hex'))
    const [challengeID, attestorIDs ] = data
    const opts = { challengeID, attestorIDs, keyring }
    await chainAPI.attest(opts)
  }
  /* --------------------------------------
            E. EVENTS
  ----------------------------------------- */
  async function handleEvent (event) {
    const address = event.data[0]
    LOG('New event:', event.method, event.data.toString())
    if (event.method === 'SomethingStored') {
      await registerAttestor()
      await registerEncoder()
      await registerHoster()
    }
    if (event.method === 'NewPin') {
      await requestHosting(event.data)
    }
    if (event.method === 'HostingStarted') {
      await submitChallenge(event.data)
    }
    if (event.method === 'Challenge') submitProof(event.data)
    if (event.method === 'ChallengeFailed') { }
    if (event.method === 'AttestPhase') attestPhase(event.data)
  }
}
