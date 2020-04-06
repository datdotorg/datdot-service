'use strict'

var isArray = require('isarray')

module.exports = EventTarget

function EventTarget () {
  this._events = {}
}
EventTarget.prototype.addEventListener = function addEventListener (name, callback) {
  if (typeof callback !== 'function') return
  if (!isArray(this._events[name])) this._events[name] = []
  this._events[name].push(callback)
}
EventTarget.prototype.removeEventListener = function removeEventListener (name, callback) {
  if (!name || !callback) return
  var events = this._events[name]
  if (isEmpty(events)) return
  var listener
  if (events.length === 1) {
    listener = events[0]
    if (listener === callback) {
      events.length = 0
      delete this._events[name]
    }
    return
  }
  for (var i = 0; i < events.length; i++) {
    listener = events[i]
    if (listener === callback) events.splice(i, 1)
  }
}
EventTarget.prototype.send = function send (name) {
  var events = this._events[name]
  if (isEmpty(events)) return
  var args = Array.prototype.slice.call(arguments, 1)
  var callback
  for (var i = 0; i < events.length; i++) {
    callback = events[i]
    callback.apply(this, args)
  }
}

function isEmpty (events) {
  return !events || !events.length
}
