const Fields = require('tre-field-observer')
const Str = require('tre-string')
const h = require('mutant/html-element')
const computed = require('mutant/computed')
const Value = require('mutant/computed')
const List = require('tre-endless-list')
const winder = require('./date-winder')
const styles = require('module-styles')('tre-dates')
const Resolver = require('./resolver')
const dayjs = require('dayjs')

module.exports = function(ssb) {
  const resolve = Resolver(ssb)

  styles(`
    .tre-dates .tre-endless-list {
      height: 5em;
    }
  `)

  return function(kv, ctx) {
    if (kv.value.content.type !== 'date') return
    const fields = Fields(ssb)(kv, ctx)
    const contentObs = ctx.contentObs || Value({})
    function set(o) {
      contentObs.set(Object.assign({}, contentObs(), o))
    }
    function rm(key) {
      const o = Object.assign({}, contentObs())
      delete o[key]
      contentObs.set(o)
    }
    const syntaxErrorObs = ctx.syntaxErrorObs || Value()

    const renderStr = Str({
      save: name => set({name})
    })

    const multiday = computed(fields.get('endDate'), x => !!x)
    const repeats = computed(fields.get('recurrence'), x => !!x)
    const forever = computed(fields.get('repeatUntil'), x => !x)
    const untilReference = computed(fields.get('repeatUntil'), x => {
      return (/\d{4}-\d{2}-\d{2}/.test(x)) == false
    })
    const wholeDay = computed(fields.get('time'), t => !t)

    let oldEndDate, oldRecurrence, oldRepeatUntil
    let oldRepeatUntilReference, oldRepeatUntilDate
    let oldTime

    return h('.tre-dates', [
      renderStr(fields.get('name', 'no name')),
      h('div.multiday', [
        h('input', {
          type: 'checkbox',
          checked: multiday,
          'ev-input': ev=>{
            if (ev.target.checked) {
              set({endDate: oldEndDate || fields.get('date')()})
            } else {
              oldEndDate = fields.get('endDate')()
              set({endDate: ''})
            }
          }
        }),
        h('span', 'multiple days')
      ]),
      h('label.first', computed(multiday, md => md ? 'From' : 'Date')),
      h('input.date', {
        type: 'date',
        value: fields.get('date'),
        'ev-change': ev => set({date: ev.target.value})
      }),
      h('label.firstEnd', computed(multiday, md => md ? 'to' : '')),
      h('input.endDate', {
        style: {
          visibility: computed(multiday, md => md ? 'visible' : 'hidden'),
        },
        type: 'date',
        value: fields.get('endDate'),
        min: fields.get('date'),
        'ev-change': ev => set({endDate: ev.target.value})
      }),
      h('div.repeats', [
        h('input', {
          type: 'checkbox',
          checked: repeats,
          'ev-input': ev=>{
            if (ev.target.checked) {
              set({recurrence: oldRecurrence || 'skip +1 year'})
            } else {
              oldRecurrence = fields.get('recurrence')()
              set({recurrence: ''})
            }
          }
        }),
        h('span', 'repeats')
      ]),
      h('input.recurrence', {
        style: {
          visibility: computed(repeats, x => x ? 'visible' : 'hidden'),
        },
        type: 'text',
        value: fields.get('recurrence') || '',
        'ev-input': ev => set({recurrence: ev.target.value})
      }),
      h('div.forever', {
        style: {
          visibility: computed(repeats, x => x ? 'visible' : 'hidden')
        }
      }, [
        h('input', {
          type: 'checkbox',
          checked: forever,
          'ev-input': ev=>{
            if (!ev.target.checked) {
              set({repeatUntil: oldRepeatUntil || fields.get('date')()})
            } else {
              oldRepeatUntil = fields.get('repeatUntil')()
              set({repeatUntil: ''})
            }
          }
        }),
        h('span', 'repeat forever')
      ]),
      h('div.untilReference', {
        style: {
          visibility: computed([repeats, forever], (repeats, forever) => !repeats ? 'hidden' : forever ? 'hidden' : 'visible')
        }
      }, [
        h('input', {
          type: 'checkbox',
          checked: untilReference,
          'ev-input': ev=>{
            if (ev.target.checked) {
              oldRepeatUntilDate = fields.get('repeatUntil')()
              set({repeatUntil: oldRepeatUntilReference || '[drop date object here]'})
            } else {
              oldRepeatUntilReference = fields.get('repeatUntil')()
              set({repeatUntil: oldRepeatUntilDate || fields.get('date')()})
            }
          }
        }),
        h('span', 'reference object')
      ]),
      computed([repeats, forever, untilReference], (repeats, forever, isReference) => {
        if (!repeats || forever) return []
        if (isReference) {
          return h('input.repeatUntil', {
            type: 'text',
            value: fields.get('repeatUntil'),
            'ev-change': ev => set({repeatUntil: ev.target.value})
          })
        } else {
          return h('input.repeatUntil', {
            type: 'date',
            value: fields.get('repeatUntil'),
            'ev-change': ev => set({repeatUntil: ev.target.value})
          })
        }
      }),
      computed( [fields.get('date'), fields.get('recurrence'), resolve(fields.get('date'), fields.get('repeatUntil'))], (d, r, lte) => {
        if (!r) return []
        let future, past
        const opts = lte ? {lte} : {}
        console.log('opts',opts)
        try {
          future = winder(`${d}|${r}`, opts)
        } catch(e) {
          syntaxErrorObs.set(e.message)
          return h('div.error', e.message)
        }
        if (!future) {
          return h('.msg', 'no recurrence')
        }
        return List(future, null, ({date, name}) => {
          return h('li', computed(fields.get('name'), x => `${date} ${name || x}`))
        })
      }),
      h('div.wholeDay', [
        h('input', {
          type: 'checkbox',
          checked: wholeDay,
          'ev-input': ev=>{
            if (ev.target.checked) {
              oldTime = fields.get('time')()
              rm('time')
            } else {
              set({time: oldTime || dayjs().format('HH:MM')})
            }
          }
        }),
        h('span', 'whole day')
      ]),
      h('label.time', 'Time'),
      h('input.time', {
        style: {
          visibility: computed(wholeDay, wd => wd ? 'hidden' : 'visible')
        },
        type: 'time',
        value: fields.get('time'),
        'ev-change': ev => set({time: ev.target.value})
      }),
      h('input.endTime', {
        style: {
          visibility: computed(wholeDay, wd => wd ? 'hidden' : 'visible')
        },
        type: 'time',
        value: fields.get('endTime'),
        min: fields.get('time'),
        'ev-change': ev => set({endTime: ev.target.value})
      }),
      h('label.notes', 'Notes'),
      h('textarea.notes', {
        rows: 5,
        cols: 40,
        'ev-input': ev => set({note: ev.target.value})
      }, fields.get('notes'))

    ])
  }
}
