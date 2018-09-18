var cadence = require('cadence')

var descendent = require('foremost')('descendent')

var Turnstile = require('turnstile')
Turnstile.Queue = require('turnstile/queue')

function Listener (destructible, olio) {
    this._olio = olio
    descendent.increment()
    destructible.destruct.wait(descendent, 'decrement')

    var turnstile = new Turnstile
    this._queue = new Turnstile.Queue(this, '_socket', turnstile)

    turnstile.listen(destructible.monitor('socket'))
    destructible.destruct.wait(turnstile, 'close')
}

Listener.prototype._socket = cadence(function (async, envelope) {
    var message = envelope.body.message, socket = envelope.body.socket
    async(function () {
        this._olio.sibling(message.to.name, async())
    }, function (sibling) {
        var path = sibling.paths[message.to.index]
        descendent.up(path, 'olio:message', message, socket)
    })
})

Listener.prototype.socket = function (request, socket) {
    var message = {
        module: 'olio',
        method: 'connect',
        to: {
            name: request.headers['x-diffuser-to-name'],
            index: +request.headers['x-diffuser-to-index']
        }
    }
    this._queue.push({ message:message, socket: socket })
}

module.exports = function (destructible, olio, callback) {
    callback(null, new Listener(destructible, olio))
}
