exports.triage = function () { return function () { return true } }

exports.process = function () {
    var Syslog = require('prolific.syslog')
    var syslog = new Syslog({ serializer: require('wafer') })
    var cadence = require('cadence')
    return cadence(function (async, destructible) {
        console.log('logger created')
        return function (entry) {
            if (
                entry.qualified != 'olio#memory' &&
                entry.qualified != 'prolific#memory' &&
                entry.qualifier != 'vizsla'
            ) {
                process.stdout.write(syslog.format(entry))
            }
        }
    })
}
