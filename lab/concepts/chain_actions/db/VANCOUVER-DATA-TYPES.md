```js
/******************************************************************************
  DEFINITION: types.js
******************************************************************************/
const TYPES = function checkAPI (kind, value) {
 if (kind === 'format') return
 if (kind === 'context') return
}

module.exports = TYPES

function check (type, message, path) {
  const input = message // e.g. BASE + SPEC_PLAN
  if (kind === 'format') return
  if (kind === 'context') return
}
function checkKey (spec, key, val) {
  // ...
  return
}
function get (what, value) {
  if (what === 'error') return error[key]
  if (what === 'example') return example[key]
  if (what === 'spec') return spec[key]
  if (what === 'docs') return docs[key]
}
function check (message, type) {
  console.log('TODO: fix types in types.js!')
  const validate = TYPES[type]
  if (!validate) return ERROR.invalid_message
  return validate(message)
}
// e.g. input = example           , type = spec
// check(type, input, key, val)

function check (type, input) { return type(input) }
function checkKey (type, key, val) {
  for (var i = 0, path = [], len = key.length; i < len; i++) {
    const part = key[i]
    path.push(part)
    if (typeof part === 'string') { // === Object Type Check Function
      type = type[part]
      if (!type) return { path, error: type }
    } else if (typeof part === 'number') { // === Array Type Check Function
      const length = type.length
      type = length(part) // e.g. too long or OK
      if (!type) return { path, error: length.error }
      // typedArray.types(part, val)
    } else throw 'TODO: maybe implement non string or number key path?'
  }
  return type(val)
}
// ------------------------------------------------------------------
const ERROR = { // ERROR TYPES
  invalid_message: 'error: invalid message type'
}
const error = function error () {}
// error.schedules
const example = function example () {}
// example.schedules
const spec = function spec () {}
// spec.schedules
const info = { speed: {error, example}, bandwidth: {error, example} }
// const info = {
//   speed: {
//     error: 'must be speed',
//     example: 123123
//   }
//   bandwidth: {
//     error: 'must be bandwidth',
//     example: { speed: info.speed.example, guarantee: info.guarantee.example }
//   }
// }

example(['schedules'])
example(['schedules', 0])
example(['schedules', 0, 'regions'])
const example = (() => {
  const examples = name => examples[`example_${name}`]
  examples.example_speed = 123123
  examples.example_guarantee = 0.8
  examples.example_bandwidth = { speed, guarantee }
  return examples
})()
example('speed')
example.example_speed

error(['schedules'])
error(['schedules', 0])
error(['schedules', 0, 'regions'])
const error = (() => {
  const errors = name => errors[`error_${name}`]
  errors.error_speed = 'must be speed'
  errors.error_guarantee = 'must be guarantee'
  errors.error_bandwidth = { speed, guarantee } // 'must be bandwidth'
  return errors
})()
error('speed')
error.error_speed

const MAIN_TYPES = { // MAIN
  batch,
  make,//_account,
  give,//_to_account,
  register,//_feed,
  offer,//_service,
  provide,//_service,
  request,//_service,
}
// ------------------------------------------------------------------
const SUB_TYPES = { } // EXPOSED SUB_TYPES
SUB_TYPES.region        = region
SUB_TYPES.availability  = availability
SUB_TYPES.speed         = speed
SUB_TYPES.guarantee     = guarantee
SUB_TYPES.time          = time
SUB_TYPES.from          = from
SUB_TYPES.schedules     = schedules
SUB_TYPES.bandwidth     = bandwidth
SUB_TYPES.latency       = latency
SUB_TYPES.performance   = performance
SUB_TYPES.regions       = regions
SUB_TYPES.config        = config
SUB_TYPES.plan          = plan

// ------------------------------------------------------------------
// BASIC HELPER TYPES
// ------------------------------------------------------------------
const BASIC_TYPES = { // BASIC TYPES (used only internally)
  array,
  object,
  percentage_decimal,
  milliseconds,
  bitspersecond,
  date,
  number,
  string,
}

array.error = 'value must be an array'
array.example = [1,2,3]
function array (value) {
  if (!Array.isArray(value)) return array.error
}
object.error = 'value must be an object'
object.example = { foo: 'bar' }
function object (value) {
  if (typeof value !== 'object' || value === null) return object.error
}

percentage_decimal.error = 'value must be a percentage decimal'
percentage_decimal.example = 0.6
function percentage_decimal (value) {
  if (0 > value || value > 1) return percentage_decimal.error
}

milliseconds.error = 'value in miliseconds must be a positive integer'
milliseconds.example = 123
function milliseconds (value) {
  if (typeof value !== 'number' || value <= 0) return milliseconds.error
}

bitspersecond.error = 'value in bps (bits per second) must be a positive float'
bitspersecond.example = 1024000
function bitspersecond (value) {
  if (typeof value !== 'number' || value <= 0) return bitspersecond.error
}

date.error = 'value must be a date "miliseconds:seconds:minutes:hours:days:weeks"'
date.example = '1234:1234:1234:1234:1234:1234'
function date (value) {
  if (typeof value !== 'string') return date.error
  const numbers = value.split(':')
  for (var i = 0; i < numbers.length; i++) {
    if (!Number.isInteger(numbers[i])) return date.error
  }
}

number.error = 'value must be a number'
number.example = 123.32
function number (value) {
  if (typeof value !== 'number') return number.error
}

string.error = 'value must be a string'
string.example = 'hello datdot'
function string (value) {
  if (typeof value !== 'string') return string.error
}

// --------------------------------------------------------------------
// MAIN TYPES
// --------------------------------------------------------------------

// SPEC - `request_service/...`

const availability = BASIC_TYPES.percentage_decimal
const speed = BASIC_TYPES.bitspersecond
const guarantee = BASIC_TYPES.percentage_decimal
const time = BASIC_TYPES.milliseconds
const from = BASIC_TYPES.date

// ------------------------------------

region.error = 'value must be a 2-tuple (latitude, longitude)'
region.example = ['2.022235323', '5.343263423']
function region (value) { // TODO: improve this to an area!
  console.log('TODO: improve this to an area!')
  if (!Array.isArryay(value)) return region.error
  const [lat, long] = value
  if (typeof lat !== 'string') return region.error
  if (typeof long !== 'string') return region.error
}

// ------------------------------------

schedules.length = function length (index, value) {
  if (!(typeof index === 'number')) return
  // if (values.length > 3) return 'must be 3 tuple'
  return this.types
}
schedules.array = function array (value) {
  if (!Array.isArray(value)) return this.error

  // if (values.length > 3) return 'must be 3 tuple'
  for (var i = 0, len = value.length; i < len; i++) {
    const error = this.types(i, value[i])
    if (error) return error
  }
}
schedules.types = function types (index, value) {
  const type = this.length(index)
  if (!type) return this.error
  if (!(typeof index === 'number')) return this.error
  return type(value)

  // const plan_keys = Object.keys(value)
  // const norm_keys = Object.keys(bandwidth)
  // if (norm_keys.filter(key => !plan_keys.includes(key)).length) return type_plan.error
  //
  // schedules
}
function schedules (...input) {
  const [value, index] = input
  if (input.length === 1) return schedules.array(value)
  if (input.length === 2) return schedules.types(index, value)
}
;(() => {
  const { schedules: error } = errors
  const { schedules: example } = examples
  const { schedules } = types
  schedules.error = error
  schedules.example = example
})()

// ------------------------------------

// const { speed: bandwidth.speed, guarantee: bandwidth.guarantee } = TYPES.bandwidth
// bandwidth.guarantee = TYPES.bandwidth.guarantee
// bandwidth.speed = TYPES.bandwidth.speed
bandwidth.guarantee = guarantee
bandwidth.speed = speed
function bandwidth (value) {
  if (!object(value)) return error(bandwidth.name)
  if (!object(value)) return error.error_bandwidth
  if (!object(value)) return error('bandwidth')
  // if (!object(value)) return bandwidth.error
  const plan_keys = Object.keys(value)
  const norm_keys = Object.keys(bandwidth)
  if (norm_keys.filter(key => !plan_keys.includes(key)).length) return type_plan.error
  bandwidth.speed(value.speed)
  bandwidth.guarantee(value.guarantee)

  Object.keys(bandwidth).forEach(key => bandwidth[key](value[key]))
}

// ------------------------------------

const latency = { lag, guarantee }
const performance = { availability, bandwidth, latency }

// ------------------------------------

const regions = [{ region, performance }]
regions.region = region
regions.performance = performance
function regions (value) {
  // if (!array(value)) return regions.error
  if (!value.length) return 'ERROR'
  if (!array(value)) return error(regions.name)
  if (!array(value)) return error.error_regions
  if (!array(value)) return error('regions')

  const plan_keys = Object.keys(value)
  const norm_keys = Object.keys(regions)
  if (norm_keys.filter(key => !plan_keys.includes(key)).length) return 'ERROR'
}

// ------------------------------------

// const config = { performance, regions }
config.performance = function performance (value) {}
config.regions = function regions (value) {}
function config (value) {
  if (!object(value)) return config.error
  // check `value`:
  // ...
  const norm_keys = Object.keys(config)
  // => ['performance', 'regions']
  const invalidperformance = config.performance(value.performance)
  if (invalidperformance) return invalidperformance
  const invalidregions = config.regions(value.regions)
  if (invalidregions) return invalidregions
}

// ------------------------------------

function register_service (value) {
  // ...
  const type = register_service[value.name]
  // name === 'hosting'
  // => type === offer_hosting
}

// ------------------------------------

function offer_hosting (value) {
  // ...
  const type = offer_hosting[value.name]
  // name === 'start'
  // => type === plan
  const plan = value
  return type(plan)
}

// ------------------------------------

plan.description = 'github.com/playproject-io/datdot/docs/plan.md'
plan.example = { feed_id, version, from, until, importance, config, schedule }
plan.error = 'value must be a plan'
function plan (value) {
  if (!object(value)) return plan.error
  // check `value`:
  const plan_keys = Object.keys(value)
  const norm_keys = Object.keys(plan)
  if (norm_keys.filter(key => !plan_keys.includes(key)).length) return plan.error
}

config.regions = reqions
regions.performance = performance

plan.feed_id = BASIC_TYPES.number
plan.version = BASIC_TYPES.number
plan.from    = BASIC_TYPES.date
plan.until   = until
plan.importance = importance
plan.config = config
plan.schedules = schedules

const plan = {
  // id, // === plan_id
  feed_id    : BASIC_TYPES.number, // TODO: improve to 1+ integers
  version    : BASIC_TYPES.number, // TODO: improve to 0+ integers
  from       : BASIC_TYPES.string, // TODO: improve to date format
  until: {
    time     : '',
    budget   : '',
    traffic  : '',
    treshold : '',
  },
  importance : '',
  config,
  schedules  : [{
    duration : '',
    delay    : '',
    interval : '',
    repeat   : '',
    config
  }]

}
function example_data_request_service_plan (opts = {}) {
  const {
    id           = 123,
    importance   = 232,
    version      = null,
    availability = 0.8,
    speed        = '20kb/s',
    guarantee    = 0.9,
    time         = '50ms',
    region       = { lat: '2.534232', long: '4.23253457' }, // 'NORTH AMERICA'
  } = opts
  const config = { // at least 1 region is mandatory (e.g. global)
    performance:{
      availability,
      bandwidth: { speed, guarantee },
      latency: { lag, guarantee },
    },
    regions: [{
      region, // e.g. 'NORTH AMERICA', TODO: see issue, e.g. latitude, longitude
      performance: {
        availability,
        bandwidth: { speed, guarantee },
        latency: { lag, guarantee },
      }
    }/*, ...*/]
  }
  const plan = {
    id,
    feed_id,
    version,
    from: '2020.03.21-00:00', // UTC-0 based (or not given => NOW)
    until: {
      time: '00:00:00:00:14',   // host 14 days, then stop:
      budget: 5325,             // host as many days as possible in total until budget is used up
      traffic: 123,             // like budget, but set a limit on traffic caused by feed if traffic will cause fees
      threshold: 25,            // if price is higher at block X than threshold, pause plan or get reduced service
    },
    importance: 22,
    config,
    schedules: [
      // delay    : when will it start after plan's `plan.from` general starting time
      // duration : how long will it be active
      // interval : how long will it pause after the duration
      // repeat   : how often will it repeat with duration -> interval after the first duration ends
      { duration: '00:00:00:9', delay: '00:00:00:17:2',  interval: '00:00:00:00:7', repeat: 2 },
      { duration: '00:00:00:9', delay: '00:00:00:17:3',  interval: '00:00:00:00:7' },
      { duration: '00:00:00:9', delay: '00:00:00:17:4',  interval: '00:00:00:00:7' },
      { duration: '00:00:00:9', delay: '00:00:00:17:5',  interval: '00:00:00:00:7' },
      { duration: '00:00:00:9', delay: '00:00:00:17:6',  interval: '00:00:00:00:7' },
      { duration: '00:00:00:24',                         interval: '00:00:00:00:7', repeat: 2 },
      { duration: '00:00:00:24', delay: '00:00:00:00:1', interval: '00:00:00:00:7', repeat: 2, config },
    ]
  }
  return plan
}

// ------------------------------------
// REQUEST SERVICE
// ------------------------------------
function request_service (message) {
  if (message !== 123) return 'error: not enough funds'
  /*
  const performance = {
    availability,
    bandwidth: { speed, guarantee },
    latency: { lag, guarantee },
  }
  const config = { // at least 1 region is mandatory (e.g. global)
    performance,
    regions: [{
      region, // TODO: see issue, e.g. latitude, longitude
      performance // optional
    }, ...]
  }
  const plan = {
    // CALCULATED TOTAL COSTS: e.g. 23 datdots / block (=6 seconds)
    id, // optional - important for CHANGE requests or START when forking an existing plan
    feed_id,
    version, // no `version` means: always latest (autoupdate)
      // higher than latest version, means auto update until that version
      // => what about ranges?
    from: '', // UTC-0 e.g. '2020.03.21-00:00' (or not given => NOW)
    until: {
      time, // if (!until) plan runs until user stops/pauses
        // if neither `budget` nor `until` is given, it SUBSCRIBES until manually canceled/paused
        // if both are set, the shorter wins (= better safe than sorry)
        // => you can still cancel+refund rest OR pause
      budget, // plan runs until budget is burned (=> derives `until` from budget)
        // in total until used up
        // is PREPAID: in that you can reserve a budget that does not spend for others
        // is PAY-AS-YOU-GO: in that you can "pause/cancel & refund the rest" the prepaid option
      threshold, // max per block for plan to be active
      traffic, // analog to `budget`
    },
    importance,     // set/update priority of feeds
        // 1. => for auto-selection by seeders
        // 2. => for deciding which feeds to fund if not enough funds to fund all
    // CONFIG & SCHEDULE GUARANTEES are EXPERIMENTAL SETTINGS
    config,
    schedules: [
      { duration, delay, interval, repeat, config },
      { duration, delay, interval, repeat, config },
      { duration, delay, interval, repeat, config },
      { duration, delay, interval, repeat, config },
      { duration, delay, interval, repeat, config },
      { duration, delay, interval, repeat, config },
    ]
  }
  */
  return
}
// ------------------------------------
// REGISTER FEED
// ------------------------------------
function register_feed (message) {
  if (message !== 123) return 'error: message should be a number'
  // const feeds = [
  //   feed_1,
  //   feed_2,
  //   // ...
  //   feed_n,
  // ]
  // const feed = {
  //   id,
  //   feedkey,       // = feed publickey
  //   swarmkey,      // = DHT topic
  //   merkleroot: { digest, signature, length },
  // }

  // OLD:
  // const feed = {
  //   disckey, // = DHT topic
  //   feedkey, // = feed publickey
  //   roots: [
  //     { hash, signature, length },
  //     { hash, signature, length },
  //     { hash, signature, length },
  //   ]
  // }
  return
}

// ------------------------------------
// MAKE ACCOUNT
// ------------------------------------
function make_account (message) {
  if (message !== 123) return 'error: message should be a number'


  return
}
/******************************************************************************
  HELPERS
******************************************************************************/
/* USAGE

  const input = {}

  const output = flatten(input)

  console.log(output)

*/
function flatten (obj) {
  const result = []
  const all = [[[], obj]]
  while (all.length) {
    const [key, lvl] = all.pop()
    if (Array.isArray(lvl)) {
      const len = lvl.length
      all.push([key.concat('length'), len])
      for (var i = 0; i < len; i++) all.push([key.concat(i), lvl[i]])
    } else if (typeof lvl === 'object' && lvl !== null) {
      const keys = Object.keys(lvl)
      for (var i = 0, len = keys.length; i < len; i++) {
        all.push([key.concat(keys[i]), lvl[keys[i]]])
      }
    } else result.push([key, lvl])
  }
  return result
}
/* USAGE

  const input = {}

  const output = set(input)

  console.log(output)

*/
function set (result, key, value) {
  for (var i = 0, o = result, len = key.length; i < len; i++) {
    const val = key[i]
    const next = key[i + 1]
    if (next === undefined) o[val] = value
    else if (typeof next === 'number') o = o[val] = []
    else o = o[val] = {}
  }
  return result
}
/* USAGE

  const input = {}

  const output = normalize(input)

  console.log(output)

*/
function normalize (path) {
  if (path[0] === '/') path = path.slice(1)
  if (path[path.length] === '/') path = path.slice(0, -1)
  return path.split('/')
}
```
