var init
module.exports = blockgenerator

function blockgenerator (log, emit) {
  if (init) throw Error('block generator already initialized')
  var currentBlock = 0
  var executeBlock
  var unsubscribe
  var actions = []
  var total = 0 // @TODO: make this BigInt

  init = setInterval(() => {
    // if (currentBlock === 0) {
    //   for (var i = 0; i < actions.length; i++) {
    //     const action = actions[i]
    //     action.executeBlock += currentBlock
    //   }
    // }
    currentBlock++
    actions = actions.filter(function keep ({ id, name, action, executeBlock }) {
      if (!id) return
      if (executeBlock < currentBlock) setTimeout(action, 0)
      else if (executeBlock === currentBlock) {
        log({ type: 'block', body: [`Executing scheduled action: ${name}`] })
        setTimeout(action, 0)
      }
      else return true
    })
    emit({ type: 'block', body: { number: currentBlock } })
    log({ type: 'block', body: [`Current block: ${JSON.stringify(currentBlock)}`] })
  }, 2000)

  function scheduleAction ({ action, delay, name }) {
    if (delay <= 0) return void setTimeout(action, 0)
    const item = { name, action, executeBlock: currentBlock + delay/*currentBlock? currentBlock + delay : delay*/ }
    const id = item.id = total = total + 1
    actions.push(item)
    log({ type: 'schedule', body: [`Pushing new action: ${name}`] })
    return id
  }
  function cancelAction (id) {
    for (var i = 0, len = actions.length; i < len; i++) {
      if (actions[i].id === id) actions[i].id = undefined
    }
  }
  return { scheduleAction, cancelAction }
}
