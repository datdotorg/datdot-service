const randomize = require('./index')
const numbers = [...Array(100).keys()] // https://goo.gl/7sNQah
const randomized = randomize(numbers)


/*
  Test 1
  ------
    * The original array should not have been mutated.
    * Check that each number is from 0 - 99.
    * Check that it's length = 100.
*/
let test1 = true

if (numbers.length !== 100) test1 = false
if (!numbers.every((num, i) => num === i)) test1 = false
console.log('Test 1:', test1 ? 'PASSED' : 'FAILED')


/*
  Test 2
  ------
    * The randomized array should have the same length as the original array.
    * The randomized array should not be the same array as the original array.
    * The randomized array should have it's contents randomized.
*/
let test2 = true

if (randomized.length !== 100) test2 = false
if (randomized === numbers) test2 = false
if (!randomized.some((num, i) => num !== numbers[i])) test2 = false
console.log('Test 2:', test2 ? 'PASSED' : 'FAILED')


/*
  Test 3
  ------
    * It should throw an error if fed anything other than an array.
*/
let test3 = true

try {
  randomize(5)
  test3 = false
} catch(e) {}

try {
  randomize({})
  test3 = false
} catch(e) {}

try {
  randomize('')
  test3 = false
} catch(e) {}

try {
  randomize(function() {})
  test3 = false
} catch(e) {}

try {
  randomize()
  test3 = false
} catch(e) {}

try {
  randomize(undefined)
  test3 = false
} catch(e) {}

try {
  randomize(null)
  test3 = false
} catch(e) {}

console.log('Test 3:', test3 ? 'PASSED' : 'FAILED')
