var cadence = require('cadence')
var Receiver = require('./receiver')
var Procession = require('procession')
var Conduit = require('conduit/conduit')
var logger = require('prolific.logger').createLogger('diffuser')
var Destructible = require('destructible')

function Connectee (destructible) {
    this._destructibe = destructible
    this.inbox = new Procession
}

Connectee.prototype._socket = cadence(function (async, message, socket) {
    var receiver
    async([function () {
        var destructible = new Destructible('listener')
        destructible.completed.wait(async())
        receiver = new Receiver(destructible, this.inbox)
        destructible.monitor('conduit', Conduit, receiver, socket, socket, null)
    }, function (error) {
        receiver.outbox.push(null)
        socket.destroy()
        logger.error('socket', { stack: error.stack })
    }])
})

Connectee.prototype.socket = function (message, socket) {
    this._socket(message, socket, this._destructibe.monitor([ 'socket', message.from, message.index, Date.now() ], true))
}

module.exports = cadence(function (async, destructible) {
    return new Connectee(destructible)
})
