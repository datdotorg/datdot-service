# Encoder Node

```javascript
// Take the encoder/decoder function to use
// Also pass in a hypercommunication instance
const encoder = new Encoder({
	Hypercore,
	communication,
	EncoderDecoder
})

// This will tell the encoder to encode some data
// It will get data from the feed and encode it
// It will them attempt to send the data to the hoster
await encoder.encodeFor(hosterKey, feedKey, index)
```
