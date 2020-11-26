module.exports = requestResponse

async function requestResponse ({ message, sendStream, receiveStream, log, wait = 10000 }) {
  return new Promise((resolve, reject) => {

    // receiveStream.on('data', (data) => {
    //   if (data.type === 'ping') {
    //     log({ type: 'requestResponse', body: [`Got ping, sending PONG`]})
    //     sendStream.write({ type: 'pong' })
    //   }
    // })
    sendStream.write(message)
    log({ type: 'requestResponse', body: [`MSG sent (requestResponse) ${message.index}`]})
    const toID = setTimeout(() => {
      receiveStream.off('data', ondata)
      const error = [message.index, 'FAIL_ACK_TIMEOUT']
      log({ type: 'error', body: [`Timeout error for message index ${message.index}: ${error}`] })
      // log({ type: 'requestResponse', body: [`Sending PING`]})
      // sendStream.write({ type: 'ping' })
      // receiveStream.on('data', (data) => {
      //   if (data.type === 'pong') log({ type: 'requestResponse', body: [`Got pong`]})
      // })
      reject(error)
    }, wait)

    receiveStream.on('data', ondata)

    function ondata (response) {
      if (response.index !== message.index) return
      receiveStream.off('data', ondata)
      clearTimeout(toID)
      log({ type: 'requestResponse', body: [`Got response: ${response}`]})
      if (response.error) return reject(new Error(response.error))
      resolve(response)
    }

  })
}
