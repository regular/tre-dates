const Winder = require('winder')
const dayjs = require('dayjs')

// defining type "named date"

function name() {
  return {
    get: nd => nd.name || '',
    set: (nd, x) => nd.name = x
  }
}

function Attribute(attrName) {
  return function attribute() {
    return {
      get: nd => nd.date[attrName](),
      inc: nd => {return {name: nd.name, date: nd.date.add(1, attrName)}},
      dec: nd => {return {name: nd.name, date: nd.date.subtract(1, attrName)}},
    }
  }
}

const codec = {
  decode: nd => {
    if (typeof nd == 'string') {
      return {
        date: dayjs(nd, 'YYYY-MM-DD'),
        name: ''
      }
    }
    return {
      date: dayjs(nd.date, 'YYYY-MM-DD'),
      name: nd.name
    }
  },
  encode: nd => {
    return {
      date: nd.date.format('ddd, YYYY-MM-DD'),
      name: nd.name
    }
  }
}

function compare(a,b) {
  if (a.date.isBefore(b.date)) return -1
  if (a.date.isAfter(b.date)) return 1
  return 0
}

module.exports = Winder(
  codec,
  compare,
  {
    name,
    day: Attribute('day'),
    week: Attribute('week'),
    month: Attribute('month'),
    year: Attribute('year')
  }
)

