const Hypercore = require('hypercore')
const RAM = require('random-access-memory')
const { toPromises } = require('hypercore-promisifier')
// const through2 = require('through2')
const Hyperbeam = require('hyperbeam')
const blockgenerator = require('./src/scheduleAction')

go()

async function go () {
  
  // get the key
  const beam123 = new Hyperbeam('temp')
  beam123.once('data', (data) => {
    const message = JSON.parse(data.toString('utf-8'))
    if (message.type === 'feedkey') {
      const feedkey = Buffer.from(message.feedkey, 'hex')
      start(feedkey)
    }
  })

  // start the task
  async function start (feedkey) {
    const clone = toPromises(new Hypercore(RAM, feedkey, {
      valueEncoding: 'utf-8',
      sparse: true, // When replicating, don't eagerly download all blocks.
    }))
  
    const cloneStream = clone.replicate(false, { live: true })
  
    const beam = new Hyperbeam('hello hello')
  
    cloneStream.pipe(beam).pipe(cloneStream)
    
  
    console.log('First clone block:', await clone.get(0)) // 'hello'
    console.log('Second clone block:', await clone.get(1)) // 'world'
    
    while (true) {
      await clone.update()
      console.log('New block:', await clone.get(clone.length - 1))
      if (clone.length === 100) break
    }
  }
}