# stackable-nanoiterator
[![Build Status](https://travis-ci.com/andrewosh/stackable-nanoiterator.svg?token=WgJmQm3Kc6qzq1pzYrkx&branch=master)](https://travis-ci.com/andrewosh/stackable-nanoiterator)

A stack-based iterator for iterating over multiple nanoiterators.

The stack iterator provides push and pop hooks, as well as a map function for modifying return values based on what's currently on the stack. Push operations can also tag iterators with state that can be accessed during `map`.

### Installation
```
npm i stackable-nanoiterator --save
```
### Usage
```js
const StackIterator = require('stackable-nanoiterator')
const ite = new StackIterator()
ite.push(iterator1)
ite.push(iterator2)
// Reading values from `ite` will now return the values from iterator2 then iterator1
```
### API
#### `const ite = new StackIterator([opts])`
Creates a new StackIterator.

Options can include:
```js
{
  maxDepth: -1, // The maximum stack depth (-1 means infinite),
  onpush: function (iterator, state) { ... } // Called when a new iterator/state pair is pushed.
  onpop: function (iterator, state) { ... } // Called when an iterator/state pair is popped.
  map: function (value, states, cb) { ... } // Called before a value is about to be returned.
  open: function (cb) { ... } // Called before the first call to next.
}
```
`onpush` and `onpop` are synchronous, but can modify the StackIterator by pushing new values onto the stack.

`map` is called with both the value that's about to be returned, and an array of the state values that you've associated with stack entries, in stack order.

`open` is async, and is called prior to the first call to `next`.

#### `ite.push(iterator, state)`
Insert a new iterator/state pair into the stack.

#### `ite.next(cb)`
Yield the next value in the iterator. Follows the [nanoiterator](https://github.com/mafintosh/nanoiterator) callback format.

#### `ite.destroy(cb`
Destroys the iterator. This will destroy all iterators currently on the stack.

### License
MIT


