# hyperdrive-promise

An async/await based wrapper for [hyperdrive](https://github.com/mafintosh/hyperdrive) (v10+)

[![Build Status](https://travis-ci.com/geut/hyperdrive-promise.svg?branch=master)](https://travis-ci.com/geut/hyperdrive-promise) [![Greenkeeper badge](https://badges.greenkeeper.io/geut/hyperdrive-promise.svg)](https://greenkeeper.io/)

## Install

```
$ npm install @geut/hyperdrive-promise
```

## Usage

`hyperdrive-promise` its totally [API compatible](https://github.com/mafintosh/hyperdrive#api) with hyperdrive v10+. It's only a promise based wrapper.

E.g.:

```javascript
const hyperdrive = require('hyperdrive-promise')
const archive = hyperdrive('./my-first-hyperdrive') // content will be stored in this folder

try {
  await archive.writeFile('/hello.txt', 'world')
  const list = await archive.readdir('/')
  console.log(list) // prints ['hello.txt']
  const data = await archive.readFile('/hello.txt', 'utf-8')
  console.log(data) // prints 'world'
} catch (err) {
  console.log(err)
  // deal with the err
}

```

## Contributing

:busts_in_silhouette: Ideas and contributions to the project are welcome. You must follow this [guideline](https://github.com/geut/hyperdrive-promise/blob/master/CONTRIBUTING.md).


## Sponsored By

[
<img src="https://github.com/libscie.png" alt="Liberate Science" width="200px" />
](https://libscie.org)
