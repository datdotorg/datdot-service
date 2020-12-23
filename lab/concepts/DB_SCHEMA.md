# DB SCHEMA

```js
// const timetable = [{
//   delay    : '', // milliseconds // default: 0
//   duration : '', // milliseconds // default: until - from
//   pause    : '', // milliseconds // default: none
//   repeat   : '', // number // default: none
// }]

// ----------------------------------------------------------------------------
// GOAL:
// ---------------
// * how to save information on chain about timetables
//   * so that we minimize CPU and storage requirements
//   * for all nodes in the network
//
// 1. we can submit timetables and store them on chain with ids
// 2. we can submit timetables and store them on chain without ids
// 3. we can submit id's of existing timetables to save space in transactions
// 4. we could index timetables OFFCHAIN to have autocomplete suggestions
// 5. we could index timetables ONCHAIN to have autocomplete suggestions
// 6. we might need to check if a given id is even an id of a timetable
//    * does chain trust UI blindly that an id refers to a timetable or not?
// 7. on timetable submit, if duplicate store again to save cpu or deduplicate?
//    * e.g. UI uses timetable index to compare and only submit id
//    * e.g. pre-published timetables available for users to choose id's from


// ---------------
// ARGUMENT 1:
// ---------------
// 1. a timetable is submitted
// 2. check if an id with given timetable data already exists in chain storage
// 3. if so: re-use that id to not create a new id with the same data
// VS.
// 1. a timetable is submitted
// 2. don't check, just store
// 3. because: minimizing CPU is because there wont be a lot of extra storage because duplicate timetables are RARE
//    => we can eithre save a lot of CPU
//    => or we can save a little bit of storage
// 3. because: minimizing CPU is more imporatant than minimizing storage
//    => we can eithre save a lot of CPU
//    => or we can save a lot of storage for many duplicates
//    ==> other polkadot/kusama chains call our service through the pure API
//    ==> they do not maintain additional storage
//    ==> they will use it for publishing plans (how do they earn datdot? they buy it on exchanges)
//    ==>


// ---------------
// ARGUMENT 2:
// ---------------
// decide whether checking if a submitted timetable already exists on chain with a given id or not is better for overall storage/cpu for nodes in the network


// ----------------------------------------------------------------------------






// ------------------------------------------------------------------
// `type/plan/:id`
// `type/user/:id` // boolean `if (user[5]) const user = storage[5]`
// ------------------------------------------------------------------




```
