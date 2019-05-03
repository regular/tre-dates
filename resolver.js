const computed = require('mutant/computed')
const WatchMerged = require('tre-prototypes')
const {isMsgId} = require('ssb-ref')

module.exports = function DateResolver(ssb) {
  const watchMerged = WatchMerged(ssb)

  return function resolve(absolute, relative) {
    return computed([absolute, relative], (absolute, relative) => {

      if (isMsgId(relative)) {
        return computed(watchMerged(relative, {
          allowAllAuthors: true,
          suppressIntermediate: true
        }), kv => {
          if (!kv) return null
          return {
            date: kv.value.content.date,
            name: kv.value.content.name
          }
        })
      }

      // relative is an absolute date
      if (/\d{4}-\d{2}-\d{2}/.test(relative)) {
        return {
          date: relative,
          name: ''
        }
      }
    })
  }
}
