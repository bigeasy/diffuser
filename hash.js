var fnv = require('hash.fnv')
var Keyify = require('keyify')

module.exports = function (key) {
    var stringified = Keyify.stringify(key)
    var buffer = Buffer.from(stringified)
    var hash = fnv(0, buffer, 0, buffer.length)
    return hash // { hash: hash, stringified: stringified, key: key }
}
