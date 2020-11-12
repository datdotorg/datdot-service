module.exports = registrationForm

// ENCODER cpu => 1 (10%) + 9
// ATTESTOR bandwidth => 1
// HOSTER storage, bandwidth => 1

// See example https://pastebin.com/5nAb6XHQ
function registrationForm (role, settings) { // attestor, encoder, hoster
  const { from, until, region = 'global'} = settings
  const form = {}
  form.storage = 1000000000 //1 GB to bytes is 1e+9
  form.capacity = 5 // based on resources needed for one job
 // resources: {
 //    bandwidth: { /*'speed', 'guarantee'*/ }, // bitspersecond, percentage_decimal
 //    cpu: '',
 //    storage: '',
 //    RAM: '',
 //  },
  form.from = from
  form.until = until
  form.schedules = [{
    // duration :  void 0, // milliseconds
    // delay    :  void 0, // milliseconds
    // interval :  void 0, // milliseconds
    // repeat   :  void 0, // number
    // config // specialized config for each schedule
  }]
  form.config = { // at least 1 region is mandatory (e.g. global)
    // @TODO
    performance: {
      availability: '', // percentage_decimal
      latency: { /*'lag', 'guarantee'*/ }, // milliseconds, percentage_decimal
    },
    regions: [{
      region: region, // e.g. 'NORTH AMERICA', @TODO: see issue, e.g. latitude, longitude
      performance: {
        // availability:  void 0, // percentage_decimal
        // latency: {  /*'lag', 'guarantee'*/ }, // milliseconds, percentage_decimal
      }
    }/*, ...*/]
  }
  return form
}
