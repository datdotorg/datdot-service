var init
module.exports = blockgenerator

function blockgenerator (log, emit) {
  if (init) throw Error('block generator already initialized')
  var currentBlock = 0
  var executeBlock
  var unsubscribe
  var actions = []

  init = setInterval(() => {
    if (currentBlock === 0) {
      for (var i = 0; i < actions.length; i++) {
        const action = actions[i]
        action.executeBlock += currentBlock
      }
    }
    currentBlock++
    console.log('Current Block', currentBlock)
    actions = actions.filter(function keep ({ action, executeBlock }) {
      if (executeBlock < currentBlock) setTimeout(action, 0)
      else if (executeBlock === currentBlock) {
        console.log('Executing scheduled action', action)
        setTimeout(action, 0)
      }
      else return true
    })
    const msg = { type: 'block', body: { number: currentBlock } }
    log(msg)
    emit(msg)
  }, 2000)

  function scheduleAction ({ action, delay }) {
    if (delay <= 0) return setTimeout(action, 0)
    actions.push({ action, executeBlock: currentBlock? currentBlock + delay : delay })
    console.log('Pushing new action', action)
  }
  return scheduleAction
}
