const nanoiterator = require('nanoiterator')
const hypertrie = require('hypertrie')
const maybe = require('call-me-maybe')

const StackIterator = require('stackable-nanoiterator')

class HypertrieGraph {
  constructor (storage, opts) {
    this.trie = hypertrie(storage, opts)
    this.ready = this.trie.ready.bind(this.trie)
    this._opts = opts
  }

  _key (opts = {}) {
    var key = '/'
    if (opts.label) key += opts.label
    if (opts.from) key += '/' + opts.from
    if (opts.to) key += '/' + opts.to
    return key
  }

  put (from, to, label, cb) {
    const key = this._key({ label, from, to })
    return maybe(cb, new Promise((resolve, reject) => {
      this.trie.put(key, null, err => {
        if (err) return reject(err)
        return resolve()
      })
    }))
  }

  del (from, to, label, cb) {
    const key = this._key({ label, from, to })
    return maybe(cb, new Promise((resolve, reject) => {
      this.trie.del(key, err => {
        if (err) return reject(err)
        return resolve()
      })
    }))
  }

  batch (ops, cb) {
    ops = ops.map(({ from, to, label, type }) => {
      return {
        key: this._key({ from, to, label }),
        type,
        value: null
      }
    })
    return maybe(cb, new Promise((resolve, reject) => {
      this.trie.batch(ops, err => {
        if (err) return reject(err)
        return resolve()
      })
    }))
  }

  iterator (opts = {}) {
    const self = this

    const ite = new StackIterator({
      maxDepth: opts.depth
    })

    const visited = new Set()

    ite.push(this.trie.iterator(this._key(opts), { recursive: true }))
    return nanoiterator({ next })

    function next (cb) {
      ite.next((err, node) => {
        if (err) return cb(err)
        if (!node) return cb(null, null)
        if (visited.has(node.key)) return next(cb)

        const split = node.key.split('/')
        const [, from, to] = split
        const nextPrefix = self._key({
          ...opts,
          from: to
        })

        ite.push(self.trie.iterator(nextPrefix))
        visited.add(node.key)

        return cb(null, { from, to })
      })
    }
  }

  replicate (isInitiator, opts) {
    return this.trie.replicate(isInitiator, opts)
  }

  close (cb) {
    if (!this.trie.feed) return process.nextTick(cb, null)
    return this.trie.feed.close(cb)
  }
}

module.exports = HypertrieGraph
