module.exports = requestResponse

async function requestResponse ({ message, sendStream, receiveStream, log, wait = 5000 }) {
  return new Promise((resolve, reject) => {

    receiveStream.on('data', (data) => {
      if (data.type === 'ping') {
        log('PING')
        log('Sending pong')
        sendStream.write({ type: 'pong' })
      }
    })
    sendStream.write(message)
    log('MSG sent (requestResponse)', message.index)
    const toID = setTimeout(() => {
      receiveStream.off('data', ondata)
      const error = [message.index, 'FAIL_ACK_TIMEOUT']
      log('Error for message index', message.index)
      log(error)
      log('Sending ping')
      debugger
      sendStream.write({ type: 'ping' })
      receiveStream.on('data', (data) => {
        if (data.type === 'pong') log('PONG')
      })
      reject(error)
    }, wait)

    receiveStream.on('data', ondata)

    function ondata (response) {
      if (response.index !== message.index) return
      receiveStream.off('data', ondata)
      clearTimeout(toID)
      log('Got response', response)
      if (response.error) return reject(new Error(response.error))
      resolve(response)
    }

  })
}
