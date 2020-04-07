const intercept = require('intercept-hypercore-storage')

const ENCODED_PREFIX = 0
const DECODED_PREFIX = 1
const PROOF_PREFIX = 2

module.exports = class HosterStorage {
  /**
  EncoderDecoder is an object with `async encode(rawData)` and `async decode(encodedData)`
  db is a levelup instance
  feed is a hypercore instance that will be used to store / seed the hosted hypercore
  **/
  constructor (EncoderDecoder, db, feed) {
    this.EncoderDecoder = EncoderDecoder
    this.db = db
    this.feed = feed
    this.unintercept = intercept(feed, {
      getData: (index, cb) => this.getData(index, cb),
      putData: (index, data, cb) => this.putData(index, data, cb)
    })
  }

  // Invoked by the encoder so that the host will store the encoded data
  async storeEncoded (index, proof, encoded) {
    // Get the decoded data at the index
    // In parallel, decode the encoded data
    const [expected, decoded] = await Promise.all([
      this.feed.get(index, {
      	valueEncoding: 'binary'
      }),
      this.EncoderDecoder.decode(encoded)
    ])

    // Check if the two are the same
    const isSame = decoded.equals(Buffer.from(expected))

    if (isSame) {
      // If it's the same save the encoded data
      // and delete the decoded data if it exists
      await this._putEncoded(index, encoded)
      await this._delDecoded(index)
      await this._putProof(index, proof)

      // Boom we're good to go
    } else {
      // If not, throw an error
      throw new Error('Encoded data does not match original')
    }
  }

  // Invoked by whoever to test that the hoster is actually hosting stuff
  async getProofOfStorage (index) {
    const [encoded, proof] = await Promise.all([
      this._getEncoded(index),
      this._getProof(index)
    ])

    return {
      index,
      encoded,
      proof
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
    return this.db.get(makeKey(ENCODED_PREFIX, index))
  }

  async _getDecoded (index) {
    return this.db.get(makeKey(DECODED_PREFIX, index))
  }

  async _putEncoded (index, data) {
    return this.db.put(makeKey(ENCODED_PREFIX, index), data)
  }

  async _putDecoded (index, data) {
    return this.db.put(makeKey(DECODED_PREFIX, index), data)
  }

  async _delDecoded (index) {
    try {
      await this.db.del(makeKey(DECODED_PREFIX, index))
    } catch {
      // Whatever, it's probably not saved
    }
  }

  async _getProof (index) {
    return this.db.get(makeKey(PROOF_PREFIX, index))
  }

  async _putProof (index, proof) {
    return this.db.put(makeKey(PROOF_PREFIX, index), proof)
  }

  async close () {
    await this.feed.close()
    await this.db.close()
  }

  async destroy () {
    await this.feed.destroy()
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
