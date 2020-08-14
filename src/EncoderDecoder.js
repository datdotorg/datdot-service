const zlib = require('zlib')
const EncoderDecoder = {
  encode: (data) => new Promise((resolve, reject) => {
    // @TODO refine options
    const options = {
      level: 12
    }
    zlib.brotliCompress(data, options, (err, encoded) => {
      encoded = Buffer.from(encoded)
      if (err) {
        console.log('Ooops, we have a problem with encoding', err)
        return reject(err)
      }
      resolve(encoded)
    })
  }),

  decode: (encoded) => new Promise((resolve, reject) => {
    // @TODO refine options
    const options = {
      finishFlush: zlib.constants.Z_FINISH
    }
    zlib.brotliDecompress(encoded, options, (err, decoded) => {
      encoded = Buffer.from(encoded)
      if (err) {
        console.log('Ooops, we have a problem with decoding', err)
        return reject(err)
      }
      resolve(decoded)
    })
  })
}
module.exports = EncoderDecoder
