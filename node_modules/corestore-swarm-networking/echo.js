const http = require('http')

const server = http.createServer((req, res) => {
  console.log('got req')
  res.end(Buffer.alloc(1024 * 40))
})
server.listen(8000)
