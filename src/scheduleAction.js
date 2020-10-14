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
    actions = actions.filter(function keep ({ action, executeBlock }) {
      console.log('Current/execute block', currentBlock, executeBlock)
      if (executeBlock === currentBlock) action()
      else return true
    })
    const msg = { type: 'block', body: { number: currentBlock } }
    log(msg)
    emit(msg)
  }, 2000)

  function scheduleAction ({ action, delay }) {
    console.log('Pushing new action', action, delay)
    actions.push({ action, executeBlock: currentBlock? currentBlock + delay : delay })
  }
  return scheduleAction
}
