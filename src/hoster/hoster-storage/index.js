const intercept = require('intercept-hypercore-storage')

const ENCODED_PREFIX = 0
const DECODED_PREFIX = 1
const PROOF_PREFIX = 2
var stuff = { storeEnc: [], storeDec: [], getEnc: [], getDec: [] }

const DB = {}

module.exports = class HosterStorage {
  /**
  EncoderDecoder is an object with `async encode(rawData)` and `async decode(encodedData)`
  db is a levelup instance
  feed is a hypercore instance that will be used to store / seed the hosted hypercore
  **/
  constructor ({ EncoderDecoder, db, feed, log }) {
    this.EncoderDecoder = EncoderDecoder
    this.db = db
    this.log = log
    this.feed = feed
    this.unintercept = intercept(feed, {
      getData: (index, cb) => this.getData(index, cb),
      putData: (index, data, cb) => this.putData(index, data, cb)
    })
  }

  // Invoked by the encoder so that the host will store the encoded data
  async storeEncoded (index, proof, encoded, nodes, signature) {
    // Get the decoded data at the index
    // In parallel, decode the encoded data
    encoded = Buffer.from(encoded)
    const decoded = await this.EncoderDecoder.decode(encoded)
    stuff.storeEnc[index] = encoded
    stuff.storeDec[index] = decoded
    const packet = {
      index,
      value: decoded,
      nodes,
      signature
    }

    // This should throw if the data is invalid
    await new Promise((resolve, reject) => {
      this.feed._putBuffer(index, decoded, packet, {}, (err) => {
        if (err) reject(err)
        else resolve()
      })
    })

    // If it's the same save the encoded data
    // and delete the decoded data if it exists
    await this._putEncoded(index, encoded)

    await this._delDecoded(index)
    await this._putProof(index, proof)


    const test_enc = await this.db.get(makeKey(ENCODED_PREFIX, index))
    const test_proof = await this.db.get(makeKey(PROOF_PREFIX, index))
    const data = {
        name: this.log.path,
        encoded: { index, original: encoded, fromdb: test_enc },
        proof:  { index, original: proof, fromdb: test_proof },
    }
    // console.log('STORING', data)
    DB[index] = data
    // console.log({DB})
  }

  // Invoked by whoever to test that the hoster is actually hosting stuff
  async getStorageChallenge (index) {
    try {
      var proof, encoded, test_enc2, test_proof2, err1, err2
      try {
        encoded = await this._getEncoded(index)
      } catch (e) {
        console.log(e)
        try {
          test_enc2 = await this.db.get(makeKey(ENCODED_PREFIX, index))
        } catch (e2) {
          console.log(e2)
        }
        err1 = true
        console.error(`ENCODED ${index} from DB failed!`)
      }

      try {
        proof = await this._getProof(index)
      } catch (e) {
        console.log(e)
        try {
          test_proof2 = await this.db.get(makeKey(PROOF_PREFIX, index))
        } catch (e2) {
          console.log(e2)
        }
        err2 = true
        console.error(`PROOF ${index} from DB failed!`)
      }

      const NOW = { name: this.log.path, index, proof, encoded, test_enc2, test_proof2 }
      const OLD = DB[index]

      if (err1 || err2) {
        console.log('NOW', {NOW})
        console.log({DB})
        console.log('OLD', {OLD})
      }

      return {
        index,
        encoded,
        proof
      }
    } catch (err) {
      console.log(err)
      // console.log('Caught new error in getStorageChallenge', index, err)
      // this.log({ type: 'hoster', data: [`New error in getStorageChallenge:${index} ${err.message}`] })
      // const _enc = await this.db.get(makeKey(ENCODED_PREFIX, index))
      // const _proof = await this.db.get(makeKey(PROOF_PREFIX, index))
      // this.log({ type: 'hoster', data: [`New error in getStorageChallenge:${index} ${err.message}`] })
    }

  }

  // Meant to be used by the hypercore storage
  getData (index, cb) {
    this._getEncoded(index)
      .then(async (encoded) => {
        // Got encoded data!
        // Decode and return it
        const decoded = await this.EncoderDecoder.decode(encoded)
        return decoded
      }, async () => {
        // Key doesn't exist? Try to get decoded version
        const decoded = await this._getDecoded(index)
        // If it exists, return it
        return decoded
      }).then((decoded) => {
        // If we got the value, send it to the CB
        cb(null, decoded)

        // Else pass unexpected errors to the CB
      }).catch(cb)
  }

  // Meant to be used by the hypercore storage
  putData (index, data, cb) {
    // Check if encoded data exists
    this._getDecoded(index).then(() => {
      // We already have the encoded version so whatever
      cb(null)
    }, async () => {
      // We don't have the encoded version so we should store the decoded version
      await this._putDecoded(index, data)
    }).then(() => cb(null), (err) => cb(err))
  }

  async _getEncoded (index) {
    const encoded = await this.db.get(makeKey(ENCODED_PREFIX, index))
    return encoded
  }

  async _getDecoded (index) {
    const decoded = await this.db.get(makeKey(DECODED_PREFIX, index))
    return decoded
  }

  async _putEncoded (index, data) {
    return this.db.put(makeKey(ENCODED_PREFIX, index), data, Buffer.from([0, 255]))
  }

  async _putDecoded (index, data) {
    return this.db.put(makeKey(DECODED_PREFIX, index), data, Buffer.from([0, 255]))
  }

  async _delDecoded (index) {
    try {
      await this.db.del(makeKey(DECODED_PREFIX, index))
    } catch {
      // Whatever, it's probably not saved
    }
  }

  async _getProof (index) {
    const proof = await this.db.get(makeKey(PROOF_PREFIX, index))
    return proof
  }

  async _putProof (index, proof) {
    return this.db.put(makeKey(PROOF_PREFIX, index), proof, Buffer.from([0, 255]))
  }

  async close () {
    await this.feed.close()
    await this.db.close()
  }

  async destroy () {
    // await this.feed.destroy()
    await this.feed.destroyStorage()
    await this.db.clear()
    await this.db.close()
  }
}

function makeKey (type, index) {
  // Allocate a buffer that holds enough for the type and the index
  const typedKey = new Uint32Array(2)

  typedKey[0] = type
  typedKey[1] = index

  return Buffer.from(typedKey.buffer)
}
