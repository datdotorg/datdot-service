const EncoderDecoder = {
  encode: (data) => Buffer.from(JSON.stringify(data.toString('utf8'))),
  decode: (data) => Buffer.from(JSON.parse(data.toString('utf8')))
}

module.exports = EncoderDecoder

// const compress = require('brotli').compress
// const decompress = require('brotli').decompress
//
// const EncoderDecoder = {
//   encode: (data) =>	compress(data, { mode: 0, quality: 11, lgwin: 22 }),
//   decode: (data) => decompress(data)
// }
//
// module.exports = EncoderDecoder
