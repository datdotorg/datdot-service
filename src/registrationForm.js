module.exports = registrationForm

// See example https://pastebin.com/5nAb6XHQ
function registrationForm (role) {
  const registration = {}
  if (role === 'attestor') {}
  if (role === 'encoder') {}
  if (role === 'hoster') {
    registration.storage = 1000000000 //1 GB to bytes is 1e+9
  }
  registration.from = new Date()
  registration.until = void 0
  registration.schedules = [{
    // duration :  void 0, // milliseconds
    // delay    :  void 0, // milliseconds
    // interval :  void 0, // milliseconds
    // repeat   :  void 0, // number
    // config // specialized config for each schedule
  }]
  registration.config = { // at least 1 region is mandatory (e.g. global)
    performance: {
      availability: void 0, // percentage_decimal
      bandwidth: { /*'speed', 'guarantee'*/ }, // bitspersecond, percentage_decimal
      latency: { /*'lag', 'guarantee'*/ }, // milliseconds, percentage_decimal
    },
    regions: [{
      region: 'global', // e.g. 'NORTH AMERICA', @TODO: see issue, e.g. latitude, longitude
      performance: {
        // availability:  void 0, // percentage_decimal
        // bandwidth: { /*'speed', 'guarantee'*/ }, // bitspersecond, percentage_decimal
        // latency: {  /*'lag', 'guarantee'*/ }, // milliseconds, percentage_decimal
      }
    }/*, ...*/]
  }
  return registration
}
