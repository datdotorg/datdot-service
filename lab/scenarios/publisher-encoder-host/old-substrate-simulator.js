const http = require('http')
const colors = require('colors/safe');
const NAME = __filename.split('/').pop().split('.')[0].toUpperCase()

const PORT = 8989
const server = http.createServer(handler)
server.listen(PORT, () => console.log(colors.yellow(`[${NAME}] ` + 'listening on  http://localhost:' + PORT)))

var originalFeed, encodedFeed

function handler (request, response) {
  const [ url, params ] = request.url.split('?')
  // request.url === '/feed1?dat=3j239fj23jtw093jtw90tjjtw9'
  if (url === '/feed1') {
    response.statusCode = 200
    originalFeed = params.split('=')[1]
    response.end()
  } else if (url === '/feed2') {
    response.statusCode = 200
    if (!originalFeed) response.statusCode = 404 //originalFeed not found
    encodedFeed = params.split('=')[1]
    response.end(originalFeed)
  } else {
    response.statusCode = 200
    if (!encodedFeed) response.statusCode = 404 //encodedFeed not found
    response.end(encodedFeed)
  }
}
