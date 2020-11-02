module.exports = registrationForm

// ENCODER cpu => 1 (10%) + 9
// ATTESTOR bandwidth => 1
// HOSTER storage, bandwidth => 1

// See example https://pastebin.com/5nAb6XHQ
function registrationForm (role, settings) {
  const { from, until, region = 'global'} = settings
  const registration = {}
  if (role === 'attestor') {}
  if (role === 'encoder') {}
  if (role === 'hoster') {
    registration.storage = 1000000000 //1 GB to bytes is 1e+9
    registration.idleStorage = 1000000000 // at the registration all the storage is idle
  }
  // @TODO registration.capacity = 2 // in the UI for attestor this means: x CPU, x bandwidth...
  registration.from = from
  registration.until = until
  registration.schedules = [{
    // duration :  void 0, // milliseconds
    // delay    :  void 0, // milliseconds
    // interval :  void 0, // milliseconds
    // repeat   :  void 0, // number
    // config // specialized config for each schedule
  }]
  registration.config = { // at least 1 region is mandatory (e.g. global)
    performance: {
      availability: '', // percentage_decimal
      bandwidth: { /*'speed', 'guarantee'*/ }, // bitspersecond, percentage_decimal
      latency: { /*'lag', 'guarantee'*/ }, // milliseconds, percentage_decimal
    },
    regions: [{
      region: region, // e.g. 'NORTH AMERICA', @TODO: see issue, e.g. latitude, longitude
      performance: {
        // availability:  void 0, // percentage_decimal
        // bandwidth: { /*'speed', 'guarantee'*/ }, // bitspersecond, percentage_decimal
        // latency: {  /*'lag', 'guarantee'*/ }, // milliseconds, percentage_decimal
      }
    }/*, ...*/]
  }
  return registration
}
