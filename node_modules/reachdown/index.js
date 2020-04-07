'use strict'

function reachdown (db, visit, strict) {
  return walk(db, visitor(visit), !!visit && strict !== false)
}

function walk (db, visit, strict) {
  if (visit(db, type(db))) return db
  if (isAbstract(db.db)) return walk(db.db, visit, strict)
  if (isAbstract(db._db)) return walk(db._db, visit, strict)
  if (isLevelup(db.db)) return walk(db.db, visit, strict)
  if (strict) return null

  return db
}

function isAbstract (db) {
  // Loose by design, for when node_modules contains multiple versions of abstract-leveldown.
  return isObject(db) && typeof db._batch === 'function' && typeof db._iterator === 'function'
}

function visitor (v) {
  return typeof v === 'function' ? v : v ? typeVisitor(v) : none
}

function typeVisitor (wanted) {
  return function (db, type) {
    return type ? type === wanted : false
  }
}

function none () {
  return false
}

function type (db) {
  if (db.type) return db.type

  // Feature-detect older versions (that don't have a type property)
  if (isLevelup(db)) return 'levelup' // For levelup < 4.3.0
  if (isEncdown(db)) return 'encoding-down' // For < 6.3.0
  if (isDeferred(db)) return 'deferred-leveldown' // For < 5.2.1
}

function isLevelup (db) {
  return isObject(db) && /^levelup$/i.test(db)
}

function isEncdown (db) {
  return isObject(db) && isObject(db.codec) && isObject(db.codec.encodings)
}

function isDeferred (db) {
  return isObject(db) && Array.isArray(db._operations) && Array.isArray(db._iterators)
}

function isObject (o) {
  return typeof o === 'object' && o !== null
}

function is (db, visit) {
  return !!visitor(visit)(db, type(db))
}

reachdown.is = is
module.exports = reachdown
