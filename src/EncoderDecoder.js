// const EncoderDecoder = {
//   encode: (data) => Buffer.from(JSON.stringify(data.toString('utf8'))),
//   decode: (data) => Buffer.from(JSON.parse(data.toString('utf8')))
// }


const zlib = require('zlib')
var counter = 0
const EncoderDecoder = {

  encode: (data) =>	new Promise((resolve, reject) => {
    const options = {
      level: 12,
    }
    zlib.brotliCompress(data, (err, encoded) => {
      encoded = Buffer.from(encoded)
      if (err) {
        console.log('Ooops, we have a problem with encoding')
        return reject(err)
      }
      resolve(encoded)
    })
  }),

  decode: (encoded) => new Promise((resolve, reject) => {
    const options = {
      finishFlush: zlib.constants.Z_FINISH,
    }
    const e = new Error('foobar')
    const stack = e.stack
    zlib.brotliDecompress(encoded, options,  (err, decoded) => {
      encoded = Buffer.from(encoded)
      counter++
      console.log('-------------', counter)
      if (err) {
        console.log('Ooops, we have a problem with decoding', err)
        console.log('more', e)
        console.log('-------------', counter)
        return reject(err)
      }
      console.log('-------------', counter)
      resolve(decoded)
    })
  })

}
module.exports = EncoderDecoder
