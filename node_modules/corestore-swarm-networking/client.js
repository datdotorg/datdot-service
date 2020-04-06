const http = require('http')

const opts = {
  host: '192.168.102.12',
  port: 8000,
  path: '/'
}

function echo () {
  return new Promise(resolve => {
    const timeId = 'req-' + Math.random()
    console.time(timeId)

    const req = http.request(opts)
    req.end()

    req.on('response', rsp => {
      console.timeEnd(timeId)
      return resolve()
    })
  })
}

async function test () {
  for (let i = 0; i < 10; i++) {
    await echo()
  }
}

test()
