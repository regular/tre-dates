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
    const revRoot = revisionRoot(kv)
    const fields = Fields(ssb)(kv, ctx)

    const date = fields.get('date')
    const time = fields.get('time')
    const recurrence = fields.get('recurrence')
    const repeatUntil = fields.get('repeatUntil')
    const name = fields.get('name')
    const lte = resolve(date, repeatUntil)

    return computed([date, time, recurrence, name, lte], (date, time, recurrence, name, lte) => {
      if (!recurrence) return {
        source: ()=>{ 
          return pull.values([{
            date, time, name,
            revisionRoot: revRoot
          }])
        }
      }
      let future
      const opts = lte ? {lte} : {}
      return {
        source: ()=> {
          try {
            future = winder(`${date}|${recurrence}`, opts)
          } catch(err) {
            if (ctx.syntaxErrorObs) ctx.syntaxErrorObs.set(err.message)
            return pull.error(err)
          }
          return pull(
            future,
            pull.through(o =>{
              o.name = o.name || name
              o.time = time
              o.revisionRoot = revRoot
            })
          )
        }
      }
    })
  }
}

function revisionRoot(kv) {
  return kv.value.content.revisionRoot || kv.key
}
