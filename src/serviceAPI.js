const colors = require('colors/safe')
const NAME = __filename.split('/').pop().split('.')[0].toUpperCase()
function LOG (...msgs) {
  msgs = [`[${NAME}] `, ...msgs].map(msg => colors.red(msg))
  console.log(...msgs)
}

module.exports = datdotService

function datdotService () {

  const serviceAPI = {
    host,
    encode,
    getProofOfStorage,
    attest,
  }
  return serviceAPI

  function host (data) {
    const {hoster, feedKeyBuffer , encoderKey, plan} = data
    return hoster.hostFeed(feedKeyBuffer, encoderKey, plan)
  }

  function encode (data) {
    const { encoder, hosterKey, feedKeyBuffer, ranges } = data
    return encoder.encodeFor(hosterKey, feedKeyBuffer, ranges)
  }

  async function getProofOfStorage (data) {
    const { account, challenge, feedKeyBuffer } = data
    const proof = await Promise.all(challenge.chunks.map(async (chunk) => {
      return await account.hoster.getProofOfStorage(feedKeyBuffer, chunk)
    }))
    return proof
  }

  async function attest (data) {
    const { account, randomChunks, feedKeyBuffer } = data
    const report = await Promise.all(randomChunks.map(async (chunk) => {
      return await account.attestor.attest(feedKeyBuffer, chunk)
    }))
    return report
  }

}
