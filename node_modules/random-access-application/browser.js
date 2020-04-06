const RAW = require('random-access-web')

module.exports = function RAA (application) {
  if (!application) throw new Error('Must specify application name for storage')

  return RAW(application)
}
