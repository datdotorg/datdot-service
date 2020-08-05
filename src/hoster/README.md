# Hoster

THis is the implementation of the DatDot Hoster node.

## API

```javascript
const hoster = await Hoster.load({
	db, // LevelUp instance for storing hosted keys / data
	Hypercore, // Hypercore constructor from the Dat SDK or somewhere equivalent
	EncoderDecoder, // Used to verify incoming encoded data
	communication, // hypercommunication channel used for recieving encoded data from encoders
	onNeedsEncoding: async (feed, index) => void 0 // Invoked when there's data that needs to be encoded
})

await hoster.addFeed(key, {
	ranges: [{start: 0, end: Infinity}],
	watch: true
})
await hoster.storeEncoded(key, index, proof, encoded)
const {proof, encoded} = await hoster.getStorageChallenge(key, index)
await hoster.removeFeed(key)
```
