module.exports = function(arr) {
  if (!Array.isArray(arr)) throw `C'mon pal. You gotta feed this thing *arrays*!`

  const randomized = []
  let copy = arr.slice() // Avoid mutating the original array.

  while (copy.length) {
    const num = Math.floor(Math.random() * copy.length)
    randomized.push(copy.splice(num, 1)[0])
  }

  return randomized
}
