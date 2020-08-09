const SDK = require('dat-sdk')
const RAM = require('random-access-memory')

const Attestor = require('./')

run()

async function run () {
  const sdk = await SDK({
    storage: RAM
  })
  const { Hypercore, close } = await SDK({ storage: RAM })

  try {
    const attestor = await Attestor.load({ sdk })

    console.log('Initializing feed')

    const feed = Hypercore('Example')

    await feed.append('Hello World!')

    console.log('Made feed:', feed.key)

    console.log('Attesting')

    const [location, latency] = await attestor.attest(feed.key, 0)

    console.log('performanceChallenge results:', { location, latency })
  } finally {
    sdk.close()
    close()
  }
}
