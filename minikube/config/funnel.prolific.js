exports.triage = function () { return function () { return true } }

exports.process = function () {
    var Syslog = require('prolific.syslog')
    var syslog = new Syslog({ serializer: require('wafer') })
    var cadence = require('cadence')
    var Keyify = require('keyify')
    var util = require('util')
    function inspect (object) {
        return util.inspect(object, { depth: Infinity })
    }
    return cadence(function (async, destructible) {
        var windows = {}
        return function (entry) {
            if (entry.qualified == 'diffuser#monkey') {
                var key = entry.from.promise + ':' + entry.from.index + ' => ' +
                    entry.to.promise + ':' + entry.to.index
                console.log(entry.qualified, key)
            } else if (entry.qualifier == 'conduit.window') {
                var key = entry.id
                switch (entry.label) {
                case 'flushing':
                case 'connecting':
                    key = { from: key.to, to: key.from }
                    break
                }
                var key = key.from.promise + ':' + key.from.index + ' => ' +
                    key.to.promise + ':' + key.to.index
                if (windows[key] == null) {
                    windows[key] = {}
                }
                switch (entry.label) {
                case 'created':
                    if (windows[key].created) {
                        console.log('ERROR RECREATE', { entry: entry })
                    }
                    windows[key].created = true
                    windows[key].id = entry.id
                    console.log(entry.qualified, key)
                    break
                case 'flush':
                    windows[key].flush = entry
                    break
                case 'flush':
                    windows[key].flushing = entry
                    break
                case 'connecting':
                    windows[key].connecting = entry
                    console.log(entry.qualified, key)
                    break
                case 'ahead':
                    console.log(entry.qualified, key, inspect(entry), inspect(windows[key]))
                    break
                }
            }
        }
    })
}
