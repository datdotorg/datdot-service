# hypertrie-multigraph
[![Build Status](https://travis-ci.com/andrewosh/hypertrie-multigraph.svg?branch=master)](https://travis-ci.com/andrewosh/hypertrie-multigraph)

A simple directed multigraph built on Hypertrie. Edges are stored in the Hypertrie using keys of the form `label/from/to`. Currently, the API exposes an iterator that performs a depth-first graph traversal.

## Installation
```
npm i hypertrie-multigraph --save
```

## Usage
```js
const ram = require('random-access-memory')
const trie = require('hypertrie')
const Graph = require('hypertrie-multigraph')

const trie = hypertrie(ram)
const graph = new Graph(trie)

await graph.put('a', 'b', 'my-label')
await graph.put('b', 'c', 'my-label')
await graph.put('e', 'f', 'other-label')

// Returns the edges a -> b and b -> c
const ite = graph.iterator({ from: 'a', label: 'my-label' })

// Returns the edge a -> b
const ite = graph.iterator({ from: 'a', label: 'my-label', depth: 1 })
```

## API

#### `const graph = new HypertrieGraph(trie)`
Creates a new graph that uses the `trie` for storage.

#### `await graph.put(from, to, label, [cb])`
Creates a labelled edge between `from` and `to`.

Returns a Promise, and can optionally be used with a callback.

#### `await graph.del(from, to, label, [cb])`
Delete an edge.

#### `await graph.batch(ops, [cb])`
Batch insert/delete many edges.

`ops` is an Array with entries of the form:
```js
{
  type: 'put' | 'del',
  from: 'a',
  to: 'b',
  label: 'my-label
}
```

#### `const ite = graph.iterator(opts)`
Creates a depth-first graph iterator that accepts the following options:
```js
{
  from: 'a'         // A starting node
  to: 'b'           // An ending node
  label: 'my-label' // Only iterate over edges with this label
  depth: 10         // Stop the iteration at a certain depth (defaults to infinity)
}
```
Omitting `from` or `to` while providing a `label` will return all edges with that label.

Iterator return values take the form `{ from, to }`

## License
MIT
