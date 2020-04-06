# random-access-application
Get a random-access-storage instance scoped to your application

```
npm i -s random-access-application
```

```js
const RAA = require('random-access-application')

// Creates a data directory for your application using the env-paths module
// Works in the web with random-access-web
const storage = RAA('my-application-name')

hyperdrive(storage)
```
