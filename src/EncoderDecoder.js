const EncoderDecoder = {
	encode: (data) => Buffer.from(JSON.stringify(data.toString('utf8'))),
	decode: (data) => Buffer.from(JSON.parse(data.toString('utf8')))
}

module.exports = EncoderDecoder
