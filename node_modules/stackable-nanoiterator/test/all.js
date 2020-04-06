const test = require('tape')
const nanoiterator = require('nanoiterator')

const StackIterator = require('..')

test('works with a single iterator', async t => {
  const ite = new StackIterator()
  ite.push(arrayIterator(['a', 'b', 'c']))
  await validate(t, ite, ['a', 'b', 'c'])
  t.end()
})

test('works with two iterators', async t => {
  const ite = new StackIterator()
  ite.push(arrayIterator(['a', 'b', 'c']))
  ite.push(arrayIterator(['d', 'e', 'f']))
  await validate(t, ite, ['d', 'e', 'f', 'a', 'b', 'c'])
  t.end()
})

test('can dynamically push during iteration', async t => {
  const ite = chainedIterator([['a', 'b', 'c'], ['d'], ['e'], ['f']])
  await validate(t, ite, ['a', 'b', 'c', 'd', 'e', 'f'])
  t.end()
})

test('does not push beyond max depth', async t => {
  const ite = new StackIterator({ maxDepth: 2 })
  ite.push(arrayIterator(['a', 'b', 'c']))
  ite.push(arrayIterator(['d']))
  ite.push(arrayIterator(['e']))
  await validate(t, ite, ['d', 'a', 'b', 'c'])
  t.end()
})

test('onpop hook is called', async t => {
  var remainingPops = 3
  const states = ['x', 'y', 'z']
  const ite = new StackIterator({
    onpop (iterator, state) {
      t.same(state, states[--remainingPops])
    }
  })

  ite.push(arrayIterator(['a', 'b', 'c']), states[0])
  ite.push(arrayIterator(['d']), states[1])
  ite.push(arrayIterator(['e']), states[2])

  await validate(t, ite, ['e', 'd', 'a', 'b', 'c'])

  t.same(remainingPops, 0)
  t.end()
})

test('map is called', async t => {
  const ite = new StackIterator({
    map (entry, states, cb) {
      return process.nextTick(cb, null, entry + '-' + states.join('-'))
    }
  })
  ite.push(arrayIterator(['a', 'b', 'c']), 'x')
  ite.push(arrayIterator(['d']), 'y')
  await validate(t, ite, ['d-y-x', 'a-x', 'b-x', 'c-x'])
  t.end()
})

test('open is called', async t => {
  const ite = new StackIterator({
    open (cb) {
      t.pass('open was called')
      t.end()
      return process.nextTick(cb, null)
    }
  })
  ite.push(arrayIterator(['a', 'b', 'c']), 'x')
  ite.push(arrayIterator(['d']), 'y')
  ite.next((err, value) => {
    t.error(err, 'no error')
    t.same(value, 'd')
  })
})

test('destroy destroys all pushed iterators', async t => {
  const ites = [
    arrayIterator(['a', 'b', 'c']),
    arrayIterator(['d']),
    arrayIterator(['e'])
  ]
  const ite = new StackIterator()
  for (const i of ites) {
    ite.push(i)
  }
  ite.destroy(err => {
    t.error(err, 'no error')
    for (const i of ites) {
      t.true(i.closed)
    }
    t.end()
  })
})

function chainedIterator (arrs) {
  const ite = new StackIterator({
    onpop: pushNext
  })

  if (arrs.length) ite.push(arrayIterator(arrs.shift()))
  return ite

  function pushNext () {
    const next = arrs.shift()
    if (next) ite.push(arrayIterator(next))
  }
}

function arrayIterator (arr) {
  return nanoiterator({ next })
  function next (cb) {
    if (!arr.length) return process.nextTick(cb, null, null)
    const entry = arr.shift()
    return process.nextTick(cb, null, entry)
  }
}

function validate (t, ite, expected) {
  var seen = 0
  return new Promise(resolve => {
    ite.next(function loop (err, value) {
      t.error(err, 'no error')
      if (!value) {
        t.same(seen, expected.length)
        return resolve()
      }
      t.same(value, expected[seen++])
      return ite.next(loop)
    })
  })
}
