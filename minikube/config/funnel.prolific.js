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
        var republics = []
        return function (entry) {
            if (entry.qualified == 'diffuser#monkey') {
                var key = entry.from.promise + ':' + entry.from.index + ' => ' +
                    entry.to.promise + ':' + entry.to.index
                console.log(entry.qualified, key)
            } else if (entry.qualifier == 'conduit.window') {
                var key = entry.id, republic = key.republic
                if (!~republics.indexOf(key.republic)) {
                    republics.push(key.republic)
                }
                if (windows == null) {
                    windows = {}
                }
                switch (entry.label) {
                case 'flushing':
                case 'connecting':
                case 'missing':
                    key = { republic: republics.indexOf(key.republic), from: key.to, to: key.from }
                    break
                default:
                    key = { republic: republics.indexOf(key.republic), from: key.from, to: key.to }
                    break
                }
                var key = key.republic + ' ' + key.from.promise + ':' + key.from.index + ' => ' +
                    key.to.promise + ':' + key.to.index
                if (windows[key] == null) {
                    windows[key] = { send: [], sendsToLog: 0 }
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
                case 'send':
                    windows[key].send.push(entry)
                    if (windows[key].send.length > 3) {
                        windows[key].send.shift()
                    }
                    if (windows[key].sendsToLog != 0) {
                        windows[key].sendsToLog--
                        console.log(entry.qualified, key, inspect(entry))
                    }
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
                    windows[key].sendsToLog = 3
                    console.log(entry.qualified, key, inspect(entry), inspect(windows[key]))
                    break
                case 'missing':
                    console.log(entry.qualified, key, inspect(entry))
                    break
                }
            }
        }
    })
}
