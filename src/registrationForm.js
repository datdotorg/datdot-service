module.exports = registrationForm

function registrationForm (settings) {

  const resources = {
    bandwidth: { /*'speed', 'guarantee'*/ }, // bitspersecond, percentage_decimal
    { upload, download, },
    cpus: '', // guarantees? availibility?
    hdd, // guarantees? availibility?
    storage: '', // guarantees? availibility? 1000000000 //1 GB to bytes is 1e+9
    RAM: '', // guarantees? availibility?
    // net: {
    //   bit: 'bit rate'
    //   cap: 'capacity'
    //   ingress, // download per second
    //   egress,  // upload per second
    //   lag, // (=latency), depends on region
    //   mtbf,  // https://en.wikipedia.org/wiki/Mean_time_between_failures
    //   // RWIN is the TCP Receive Window and RTT is the round-trip time for the path.
    //   // goodput = (max no of pkts recvd by the rx in sequence)*packetsize
    //            // / measurement interval
    //   // departure rate vs. arrival rate
    // },
    // availability: {
    //   uptime,
    //   downtime: '%/'
    // }
    // guarantee: {
    //   // https://en.wikipedia.org/wiki/Total_resolution_time
    //   //
    //   mtbf: {
    //     start: ,
    //     stop: '',
    //   }
    //   // https://en.wikipedia.org/wiki/Mean_time_between_failures
    // }
  }
  const performance = { // OPTIONAL
    availability: '', // percentage_decimal
    bandwidth: { /*'speed', 'guarantee'*/ }, // bitspersecond, percentage_decimal
    latency: { /*'lag', 'guarantee'*/ }, // milliseconds, percentage_decimal
  }
  const region = 'global'
  const form = {
    components: { resources, performance, timetables, region },
    // @TODO should times be converted into blocks??
    from        : blockNow, // or new Date('Apr 30, 2000')
    until       : untilBlock, // date
    timetables  : [0, 1],
    region      : 0,
    performance : 0,
    resources   : 0,
    // ENCODER cpu => 1 (10%) + 9
    // ATTESTOR bandwidth => 1
    // HOSTER storage, bandwidth => 1
  }
  return form
}
