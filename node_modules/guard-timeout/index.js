'use strict'
const customPromisify = require('util').promisify.custom
const onTimeout = Symbol('guard-timeout')
const maxInt = Math.pow(2, 31) - 1

const defaults = {
  lagMs: 1000,
  rescheduler: (t) => t
}

function createSafeTimeout (opts = {}) {
  const { lagMs, rescheduler } = { ...defaults, ...opts }
  if (lagMs > maxInt) {
    throw Error('guard-timeout: lagMs must be (significantly) less than maxInt')
  }
  if (typeof rescheduler !== 'function') {
    throw Error('guard-timeout: rescheduler must be a function')
  }
  function guardTimeout (fn, t, ...args) {
    const gaurdTime = t + lagMs
    let maxLag = Date.now() + gaurdTime
    let timeout = bWrap(setTimeout(handler, t, ...args))
    // v10
    const unrefed = Object.getOwnPropertySymbols(timeout).find((s) => /unrefed/.test(s.toString()))
    // v12
    const refed = Object.getOwnPropertySymbols(timeout).find((s) => /\(refed\)/.test(s.toString()))

    function handler (args = []) {
      if (Date.now() > maxLag) {
        maxLag = Date.now() + gaurdTime
        const unref = timeout[unrefed] === true
        const ref = refed in timeout ? timeout[refed] === true : true
        const rescheduledTime = rescheduler(t, timeout)
        timeout = bWrap(setTimeout(handler, rescheduledTime, ...args), timeout)
        if (typeof timeout === 'number') timeout = { id: timeout, valueOf () { return this.id } }
        if (unref || !ref) {
          timeout.unref()
        }
        return
      }
      fn(...args)
    }

    timeout[onTimeout] = timeout._onTimeout
    Object.defineProperty(timeout, '_onTimeout', {
      get () {
        return this[onTimeout]
      },
      set (v) {
        if (v === null && this !== timeout) {
          clearTimeout(timeout)
        }
        return (this[onTimeout] = v)
      }
    })

    return timeout
  }

  guardTimeout[customPromisify] = (t) => {
    let r = null
    const timeout = guardTimeout(() => {
      r()
    }, t)
    const promise = new Promise((resolve) => {
      r = resolve
      return timeout
    })
    promise.timeout = timeout
    return promise
  }

  return guardTimeout
}

const guardTimeout = createSafeTimeout()
guardTimeout.create = createSafeTimeout

function bWrap (timeout, prior) {
  if (typeof timeout === 'number') {
    if (prior) {
      prior.priors = prior.priors || []
      prior.priors.push(prior.id)
      prior.id = timeout
      return prior
    }
    return {
      id: timeout,
      priors: null,
      valueOf () {
        if (this.priors !== null) {
          this.priors.forEach(clearTimeout)
        }
        return this.id
      }
    }
  }
  return timeout
}

module.exports = guardTimeout
