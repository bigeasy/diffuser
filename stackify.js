var coalesce = require('extant')
module.exports = function (logger, label, level) {
    var vargs = []
    vargs.push.apply(vargs, arguments)
    var logger = vargs.shift()
    var label = vargs.shift()
    var level = typeof vargs[0] == 'string' ? vargs.shift() : 'error'
    var additional = coalesce(vargs.shift(), {})
    return function (error) {
        var properties = {}
        Object.getOwnPropertyNames(error).forEach(function (property) {
            properties[property] = error[property]
        })
        for (var key in additional) {
            properties[key] = additional[key]
        }
        logger.log(coalesce(level, 'error'), label, properties)
    }
}
