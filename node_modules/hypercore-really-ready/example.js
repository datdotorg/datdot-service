const reallyReady = require('./')
const hypercore = require('hypercore')
const RAM = require('random-access-memory')

const feed1 = hypercore(RAM)

feed1.append('Hello World', () => {
  const feed2 = hypercore(RAM, feed1.key)

  reallyReady(feed2, () => {
    console.log('Feed2 is really ready now with length', feed2.length)
  })

  feed2.ready(() => {
		console.log('Feed2 is ready now with length', feed2.length)

		const replicate1 = feed1.replicate(true)
		const replicate2 = feed2.replicate(false)

		replicate1.pipe(replicate2).pipe(replicate1)
  })
})
