const dayjs = require('dayjs').extend(require('dayjs/plugin/localizedFormat'))

module.exports = function format(date, time, name) {
  const d = dayjs(date + (time ? ` ${time}` : ''), 'YYYY-MM-DD' + (time ? ` ${time}` : ''))
  return d.format(`ddd, ll${time ? ' LT': ''}`) + ' ' + name
}
