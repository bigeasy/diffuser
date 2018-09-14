var cadence = require('cadence')
var Receiver = require('./receiver')
var Procession = require('procession')
var Conduit = require('conduit/conduit')

function Listener (destructible) {
    this._destructibe = destructible
    this.inbox = new Procession
}

Listener.prototype.update = function (routes) {
    for (var key in this._windows) {
        this._windows[key].receiver.outbox.push({
            module: 'diffuser',
            method: 'update',
            body: routes
        })
    }
}

Listener.prototype._socket = cadence(function (async, destructible, message, socket) {
    var receiver = new Receiver(destructible, this.inbox)
    // Create a conduit.
    destructible.monitor('conduit', Conduit, receiver, socket, socket, async())
})

Listener.prototype.socket = function (message, socket) {
    this._destructibe.monitor([ 'socket', message.from, message.index, Date.now() ], true, this, '_socket', message, socket, null)
}

module.exports = cadence(function (async, destructible) {
    return new Listener(destructible)
})
