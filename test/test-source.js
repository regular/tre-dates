const test = require('tape')
const pull = require('pull-stream')
const Source = require('../source')

test('single date', t=>{
  const source = Source({})
  const date = '1901-02-03'
  const time = '00:01'
  const name = 'foo'
  const revisionRoot = 'bar'
  const kv = {
    value: {
      content: {
        type: 'date',
        date, time, name,
        revisionRoot
      }
    }
  }
  pull(
    source(kv)().source(),
    pull.collect( (err, result) => {
      t.error(err)
      t.equal(result.length, 1)
      t.deepEqual(result[0], {
        date, time, name, revisionRoot
      })
      t.end()
    })
  )
})

test('recurring (open ended)', t=>{
  const source = Source({})
  const date = '1901-02-03'
  const time = '00:01'
  const name = 'foo'
  const recurrence = 'skip +n day|set name bar-%n'
  const revisionRoot = 'bar'
  const kv = {
    value: {
      content: {
        type: 'date',
        date, time, name, recurrence,
        revisionRoot
      }
    }
  }
  pull(
    source(kv)().source(),
    pull.take(10),
    pull.collect( (err, result) => {
      t.error(err)
      t.equal(result.length, 10)
      t.deepEqual(result[0], {
        date, time, name: 'bar-0', revisionRoot
      })
      t.deepEqual(result[9], {
        date: '1901-02-12', time, name: 'bar-9', revisionRoot
      })
      t.end()
    })
  )
})
