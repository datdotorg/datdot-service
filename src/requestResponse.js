module.exports = requestResponse

async function requestResponse ({ message, sendStream, receiveStream, log, wait = 5000 }) {
  return new Promise((resolve, reject) => {
    sendStream.write(message)
    const toID = setTimeout(() => {
      receiveStream.off('data', ondata)
      const error = [message.index, 'FAIL_ACK_TIMEOUT']
      log(error)
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
