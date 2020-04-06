# dom-event-target [![Build Status](https://travis-ci.org/bendrucker/dom-event-target.svg?branch=master)](https://travis-ci.org/bendrucker/dom-event-target)

> DOM [`EventTarget`](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget) compatible events interface


## Install

```
$ npm install --save dom-event-target
```


## Usage

```js
var EventTarget = require('dom-event-target');
var target = new EventTarget()
target.addEventListener('myEvent', function () {
  console.log('myEvent fired')
})
```

## API

#### `new EventTarget()`

Creates a new EventTarget

---

#### `addEventListener(event, callback)` -> `undefined`

##### event

*Required*  
Type: `string`

The name of the event.

##### callback

*Required*  
Type: `function`

The event callback.

---

#### `removeEventListener(event, callback)` -> `undefined`

*Required*  
Type: `string`

The name of the event.

##### callback

*Required*  
Type: `function`

The event callback.

---

#### `send(event, [...args])` -> `undefined`

`send` is variadic and is called with the event name and arguments to be passed to the event callback

##### event

*Required*  
Type: `string`

The name of the event.

## License

MIT © [Ben Drucker](http://bendrucker.me)
