# hyperswarm-proxy-ws
Proxy hyperswarm connections over websockets with auto-reconnect logic

```
npm -s hyperswarm-proxy-ws
```

## Example

```js

const HyperswarmServer = require('hyperswarm-proxy-ws/server')

// Initialize the proxy server
// Also specify any options for hyperswarm here
// https://github.com/hyperswarm/hyperswarm
const server = new HyperswarmServer()

// Start listening on clients via websocket protocol
server.listen(3472)


const HyperswarmClient = require('hyperswarm-proxy-ws/client')

// Initialize a proxied hyperswarm
// Also specify any options for hyperswarm-proxy client
// https://github.com/RangerMauve/hyperswarm-proxy#client
const swarm = new HyperswarmClient({
	// Specify the proxy server to connect to
	proxy: 'ws://127.0.0.1:3472'
})

// Same as with hyperswarm
swarm.on('connection', (connection, info) => {
	const stream = getSomeStream(info.topic)

	// Pipe the data somewhere
	// E.G. hyperdrive.replicate()
	connection.pipe(stream).pipe(connection)
})

swarm.join(topic)

swarm.leave(topic)
```
