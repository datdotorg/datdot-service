const Hypercore = require('hypercore')
const RAM = require('random-access-memory')
const { toPromises } = require('hypercore-promisifier')
const Hyperbeam = require('hyperbeam')

go()

async function go () {
  const core = toPromises(new Hypercore(RAM, {
    valueEncoding: 'utf-8' // The blocks will be UTF-8 strings.
  }))

  await core.ready()
  const key = core.key
  console.log(key.toString('hex'))

  await core.append(['hello', 'world'])

  const coreStream = core.replicate(true, { live: true })

  const beam123 = new Hyperbeam('temp')
  const beam = new Hyperbeam('hello hello')
  beam123.write(JSON.stringify({ type: 'feedkey', feedkey: core.key.toString('hex')}))

  coreStream.pipe(beam).pipe(coreStream)

  for (let i = 0; i < 100; i++) {
    await core.append(`New Block ${i}`)
  }
  setTimeout(async () => await core.append('yay'), 15000)
  setTimeout(async () => await core.append('yoooy'), 17000)
}