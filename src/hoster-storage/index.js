const intercept = require('intercept-hypercore-storage')

const ENCODED_PREFIX = 0
const DECODED_PREFIX = 1
const PROOF_PREFIX = 2
var stuff = { storeEnc: [], storeDec: [], getEnc: [], getDec:[] }
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
  async storeEncoded (index, proof, encoded, nodes, signature) {
    // Get the decoded data at the index
    // In parallel, decode the encoded data
    encoded = Buffer.from(encoded)
    console.log("STOOOOOOOOOOOOOOOORE ENCODED", encoded)
    console.log("STOOOOOOOOOOOOOOOORE ENCODED to STRING", encoded.toString())
    const decoded = await this.EncoderDecoder.decode(encoded)
    console.log("STOOOOOOOOOOOOOOOORE DECODED", decoded)
    console.log("STOOOOOOOOOOOOOOOORE DECODED to STRING", decoded.toString())
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
  }

  // Invoked by whoever to test that the hoster is actually hosting stuff
  async getStorageChallenge (index) {
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
        const enc = stuff.storeEnc[index]
        const dec = stuff.storeDec[index]
        console.log('------------------------------------------------')
        console.log('A: LOADED ENCODEDs type:')
        console.log('------------------------------------------------')
        console.log(typeof encoded)
        console.log('------------------------------------------------')
        console.log('B: LOADED ENCODED:')
        console.log('------------------------------------------------')
        console.log(encoded)
        console.log('------------------------------------------------')
        console.log('C: ORIGINAL ENCODED to STRING:')
        console.log('------------------------------------------------')
        console.log(enc.toString())
        const encoded2 = Buffer.from(encoded, 'binary')
        console.log('------------------------------------------------')
        console.log('D: BUFFERIFIED(binary) ENCODED to STRING:')
        console.log('------------------------------------------------')
        console.log(encoded2.toString())
        console.log('------------------------------------------------')
        console.log('E: ORIGINAL ENCODED to HEX:')
        console.log('------------------------------------------------')
        console.log(enc.toString('hex'))
        console.log('------------------------------------------------')
        console.log('F: BUFFERIFIED(binary) ENCODED to HEX:')
        console.log('------------------------------------------------')
        console.log(encoded2.toString('hex'))
        console.log('------------------------------------------------')
        console.log('C === B', enc.toString() === encoded)
        console.log('C === D', enc.toString() === encoded2.toString())
        console.log('E === F', enc.toString('hex') === encoded2.toString('hex'))

        const decoded = await this.EncoderDecoder.decode(encoded)
        console.log('DECOOOOOODED', decoded)
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
