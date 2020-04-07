# reachdown

> **Get the inner db of an `(abstract-)level(up|down)` onion.**  
> Useful for modules like `subleveldown` to peel off redundant layers.

[![npm status](http://img.shields.io/npm/v/reachdown.svg)](https://www.npmjs.org/package/reachdown)
[![node](https://img.shields.io/node/v/reachdown.svg)](https://www.npmjs.org/package/reachdown)
[![Travis build status](https://img.shields.io/travis/vweevers/reachdown.svg?label=travis)](http://travis-ci.org/vweevers/reachdown)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Example

```js
const reachdown = require('reachdown')
const db = require('level')('example')
```

Get the innermost `db`, which in this case is a `leveldown` instance in node or `level-js` in browsers:

```js
const down = reachdown(db)
```

Get a specific layer by [type](#supported-types):

```js
const enc = reachdown(db, 'encoding-down')
const down = reachdown(enc)
const levelup = reachdown(db, 'levelup') // levelup === db
```

Use a visitor function:

```js
const down = reachdown(db, function (db, type) {
  return db.someProperty && type !== 'levelup'
})
```

## API

### `db = reachdown(db[, visit][, strict = false])`

The `db` argument is required and must be a recent-ish `levelup`, `abstract-leveldown` or `subleveldown` instance. The `visit` argument can be:

- A string, to find the first `db` with a matching type
- A function, to find the first `db` for which `visit` returns a truthy value
- Omitted or falsy, to find the innermost `db`.

If `visit` is non-falsy and no matching `db` is found, `reachdown` returns `null` unless `strict` is `false` in which case it returns the innermost `db`.

### `bool = reachdown.is(db, visit)`

Utility to determine the type of `db` without reaching down. The `visit` argument is the same as above, i.e. a string or a function. Example:

```js
if (reachdown.is(db, 'levelup')) {
  // ..
}
```

Which is the same as the following, except that `reachdown.is(..)` also works on older versions that don't have a `type` property:

```js
if (db.type === 'levelup') {
  // ..
}
```

## Supported Types

- `levelup` (>= 0.0.2 only if db is open, otherwise >= 2.0.0)
- `encoding-down` (>= 1)
- `deferred-leveldown` (>= 0.3.0 only if db is open, otherwise >= 2.0.0)
- `subleveldown` (>= 4)
- `multileveldown` (TBD)
- Yours?

Implementations of `abstract-leveldown` can declare a type like so:

```js
MyLeveldown.prototype.type = 'my-leveldown'
```

So that consumers can find that layer:

```js
var down = MyLeveldown()
var db = levelup(down)

reachdown(db, 'my-leveldown') === down
```

## Install

With [npm](https://npmjs.org) do:

```
npm install reachdown
```

## License

[MIT](LICENSE.md) © 2019-present Vincent Weevers
