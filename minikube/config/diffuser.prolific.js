exports.triage = function () { return function () { return true } }

exports.process = function () {
    var Syslog = require('prolific.syslog')
    var syslog = new Syslog({ serializer: require('wafer') })
    var cadence = require('cadence')
    return cadence(function (async, destructible) {
        return function (entry) {
            if (entry.qualified != 'process#memory') {
                process.stdout.write(syslog.format(entry))
            }
        }
    })
}
