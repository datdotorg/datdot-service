# intercept-hypercore-storage
Intercept the data storage in a hypercore. Made for the datdot project

```shell
npm i --save intercept-hypercore-storage
```

```js
const intercept = require('intercept-hypercore-storage')

// Get an instance of a hypercore
const feed = hypercore()

// Start intercepting
const unintercept = intercept(feed, {
  // This tells you to save the data somewhere
  // Only the data storage is intercepted
  // The storage of the signatures is being stored normally
  // The `index` is the index of the chunk in the hypercore
  putData: (index, data, cb) => cb(null),
  // Use this to retrieve the data you stored
  getData: (index, cb) => cb(null, thedata)
})

// Replicate the feed with a peer
feed.replicate({stream})

// If you're done intercepting and want to clean up the monkey patching, use this.
unintercept()
```

## How it works

The module will [monkey-patch](https://en.wikipedia.org/wiki/Monkey_patch) your hypercore instance and intercept it's attempts to store and retrieve the data portion.
