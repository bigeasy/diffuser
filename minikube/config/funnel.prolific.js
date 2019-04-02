exports.triage = function () { return function () { return true } }

exports.process = function () {
    var cadence = require('cadence')
    var path = require('path')
    return cadence(function (async, destructible) {
        var windows = {}
        var republics = []
        var Window = require(path.join(process.cwd(), 'prolific/window'))()
        return function (entry) {
            if (entry.qualified == 'diffuser#monkey') {
                var key = entry.from.promise + ':' + entry.from.index + ' => ' +
                    entry.to.promise + ':' + entry.to.index
                console.log(entry.qualified, key)
            } else {
                Window(entry)
            }
        }
    })
}
