exports.triage = function () { return function () { return true } }

exports.process = function () {
    var Syslog = require('prolific.syslog')
    var syslog = new Syslog({ serializer: require('wafer') })
    var cadence = require('cadence')
    var Keyify = require('keyify')
    return cadence(function (async, destructible) {
        var windows = {}
        return function (entry) {
            if (entry.qualifier == 'conduit.window') {
                process.stdout.write(syslog.format(entry))
                switch (entry.label) {
                case 'create':
                    var key = Keyify.stringify(entry.id)
                    if (windows[key]) {
                        console.log('ERROR RECREATE', { entry: entry })
                    }
                    windows[key] = { id: id, flush: entry.flush }
                    break
                case 'reconnect':
                    break
                }
            }
        }
    })
}
