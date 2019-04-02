require('proof')(2, prove)

function prove (okay) {
    var stackify = require('../stackify')
    var error = Error('error')
    error.code = 'ECONNRESET'
    stackify({
        log: function (level, label, properties) {
            okay({
                level: level,
                label: label,
                stack: !! properties.stack,
                code: properties.code
            }, {
                level: 'error',
                label: 'exception',
                stack: true,
                code: 'ECONNRESET'
            }, 'stackify')
        }
    }, 'exception')(error)
    stackify({
        log: function (level, label, properties) {
            okay({
                level: level,
                label: label,
                stack: !! properties.stack,
                code: properties.code,
                value: properties.value
            }, {
                level: 'panic',
                label: 'exception',
                stack: true,
                code: 'ECONNRESET',
                value: 1
            }, 'stackify set level and additional properties')
        }
    }, 'exception', 'panic', { value: 1 })(error)
}
