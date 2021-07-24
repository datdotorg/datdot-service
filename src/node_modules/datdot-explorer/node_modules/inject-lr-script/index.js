var respModifier = require('resp-modifier')
var path = require('path')

module.exports = injectLiveReloadSnippet
function injectLiveReloadSnippet (opts) {
  opts = opts || {}

  var modifier = respModifier({
    rules: [
      { match: /<body[^>]*>/i, fn: prepend }
    ]
  })

  var fn = function (req, res, next) {
    var ext = path.extname(req.url)
    if (!ext || /\.html?$/i.test(ext)) {
      if (!req.headers.accept) {
        req.headers.accept = 'text/html'
      }
    }
    modifier(req, res, next)
  }

  fn.host = opts.host
  fn.port = opts.port
  fn.path = opts.path
  fn.local = opts.local
  fn.async = opts.async
  fn.defer = opts.defer
  fn.type = opts.type

  function snippet () {
    var host = fn.host || 'localhost'
    var port = fn.port || 35729
    var scriptPath = fn.path || '/livereload.js?snipver=1'
    var src = fn.local ? scriptPath : ('//' + host + ':' + port + scriptPath)
    var type = fn.type || 'text/javascript'
    var async = fn.async !== false
    var defer = fn.defer !== false
    var attrs = [
      ['type', type],
      ['src', src],
      async ? ['async', ''] : false,
      defer ? ['defer', ''] : false
    ]
      .filter(Boolean)
      .map(function (arg) {
        return arg[0] + '=' + JSON.stringify(arg[1])
      })
      .join(' ')
    return '<script ' + attrs + '></script>'
  }

  function prepend (req, res, body) {
    return body + snippet()
  }

  return fn
}
