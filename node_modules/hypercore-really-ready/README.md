# hypercore-really-ready
Waits for a hypercore to be _really_ ready. That is, that it's synced with peers and is good to go

Checks for the following:

- Waits for the `ready` event to make sure internal stuff is initialized
- If the feed is writable, it's ready
- If you have peers, make sure you know what the latest index they know if is
- If you don't have peers, wait for them and update the index

You should probably wrap this with a timeout for any user-facing application since there's a chance a feed will never get peers.

## Installing

```
npm install --save hypercore-really-ready
```

## Example

```javascript
const reallyReady = require('hypercore-really-ready')

// The feed is initialized and has synced with peers
// You might want to wrap this in a timeout
await reallyReady(feed)

// If you have a hyperdrive, pass in its metadata feed
// This will make sure you don't get empty or outdated readdir calls
await reallyReady(hyperdrive.metadata)

// You can also use callbacks if that's more your thing
reallyReady(feed, (err) => {
	if(err) console.error(err)
	else console.log('It's ready!')
})
```
