const envPaths = require('env-paths')
const randomAccessFile = require('random-access-file')
const path = require('path')

module.exports = function RAA (application) {
  if (!application) throw new Error('Must specify application name for storage')

  const paths = envPaths(application)

  const dir = paths.data

  return (file) => randomAccessFile(path.join(dir, file))
}
