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
      if (executeBlock < currentBlock) setTimeout(action, 0)
      else if (executeBlock === currentBlock) {
        log({ type: 'block', body: [`Executing scheduled action: ${action}`] })
        setTimeout(action, 0)
      }
      else return true
    })
    emit({ type: 'block', body: { number: currentBlock } })
    log({ type: 'block', body: [`Current block: ${JSON.stringify(currentBlock)}`] })
  }, 2000)

  function scheduleAction ({ action, delay }) {
    if (delay <= 0) return setTimeout(action, 0)
    actions.push({ action, executeBlock: currentBlock? currentBlock + delay : delay })
    log({ type: 'block', body: [`Pushing new action: ${action}`] })
  }
  return scheduleAction
}
