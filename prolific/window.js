var util = require('util')

function inspect (object) {
    return util.inspect(object, { depth: Infinity })
}

module.exports = function () {
    var windows = {}
    var republics = []
    return function (entry) {
        if (entry.qualifier != 'conduit.window') {
            return false
        }
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
        return true
    }
}
