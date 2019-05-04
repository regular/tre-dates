const pull = require('pull-stream')
const computed = require('mutant/computed')
const Value = require('mutant/value')
const winder = require('./date-winder')
const Resolver = require('./resolver')
const Fields = require('tre-field-observer')

module.exports = function(ssb) {
  const resolve = Resolver(ssb)

  return function(kv, ctx) {
    if ((kv && kv.value.content.type) !== 'date') return Value(pull.values([]))
    const fields = Fields(ssb)(kv, ctx)

    const date = fields.get('date')
    const recurrence = fields.get('recurrence')
    const repeatUntil = fields.get('repeatUntil')
    const name = fields.get('name')
    const lte = resolve(date, repeatUntil)

    return computed([date, recurrence, name, lte], (date, recurrence, name, lte) => {
      if (!recurrence) return {source: pull.values([{date, name}])}
      let future
      const opts = lte ? {lte} : {}
      try {
        future = winder(`${date}|${recurrence}`, opts)
      } catch(err) {
        if (ctx.syntaxErrorObs) ctx.syntaxErrorObs.set(err.message)
        return {source: pull.error(err)}
      }
      const namedFuture = pull(
        future,
        pull.through(o =>{
          o.name = o.name || name
        })
      )
      return {source: namedFuture}
    })
  }
}
