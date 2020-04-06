const hypercore = require('hypercore')
const RAM = require('random-access-memory')
const tmp = require('tmp')
const fs = require('fs')
const path = require('path')

tmp.setGracefulCleanup()

const intercept = require('./')

const test = require('tape')

test('can intercept hypercore storage', (t) => {
  t.plan(3)

  const storageDir = tmp.dirSync().name

  const writer = hypercore(RAM)

  writer.append('hello', () => {
    const reader = hypercore(RAM, writer.key)

    reader.ready(() => {
      const unintercept = intercept(reader, { putData, getData })

      const stream1 = writer.replicate(true)
      const stream2 = reader.replicate(false)

      stream1.pipe(stream2).pipe(stream1)

      reader.get(0, (err) => {
        t.notOk(err, 'read chunk from peer')
        unintercept()
        t.end()
      })
    })
  })

  function putData (index, data, cb) {
    t.equal(index, 0, 'stored data from intercept')
    fs.writeFile(makeLocation(index), data, cb)
  }

  function getData (index, cb) {
    t.equal(index, 0, 'read data from intercept')
    fs.readFile(makeLocation(index), cb)
  }

  function makeLocation (index) {
    return path.join(storageDir, `${index}.bin`)
  }
})
