var Monotonic = require('monotonic').asString
var Procession = require('procession')

function Backlogger () {
    this.queue = new Procession
    this._backlogs = {}
    this.promise = null
}

Backlogger.prototype.setPromise = function (promise) {
    this.promise = promise
    var promises = Object.keys(this._backlogs).sort(Monotonic.compare)
    while (promises.length != 0 && Monotonic.compare(promises[0], promise) <= 0) {
        var next = promises.shift()
        var backlog = this._backlogs[next]
        delete this._backlogs[next]
        var envelope
        while ((envelope = backlog.shifter.shift()) != null) {
            this.queue.push(envelope)
        }
    }
}

Backlogger.prototype.push = function (envelope) {
    if (envelope.promise == null || Monotonic.compare(envelope.promise, this.promise) <= 0) {
        this.queue.push(envelope)
    } else {
        var backlog = this._backlogs[envelope.promise]
        if (backlog == null) {
            backlog = this._backlogs[envelope.promise] = {
                queue: new Procession,
                shifter: null
            }
            backlog.shifter = backlog.queue.shifter()
        }
        backlog.queue.push(envelope)
    }
}

module.exports = Backlogger
