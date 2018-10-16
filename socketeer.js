var cadence = require('cadence')

var Turnstile = require('turnstile')
Turnstile.Queue = require('turnstile/queue')

var Signal = require('signal')
var Cubbyhole = require('cubbyhole')

var descendent = require('foremost')('descendent')

function Socketeer (destructible) {
    descendent.increment()
    destructible.destruct.wait(descendent, 'decrement')
    this.turnstile = new Turnstile
    this._names = new Cubbyhole
    this.turnstile.listen(destructible.monitor('socketeer'))
    this.queue = new Turnstile.Queue(this, '_socket', this.turnstile)
    this.olio = new Signal
}

Socketeer.prototype.setNames = function (names) {
    for (var promise in names) {
        this._names.set(promise, null, names[promise])
    }
    this._names.keys().forEach(function (key) {
        if (names[key] == null) {
            this._names.remove(key)
        }
    }, this)
}

Socketeer.prototype._socket = cadence(function (async, envelope) {
    var request = envelope.body.request, socket = envelope.body.socket
    var message = {
        from: {
            promise: request.headers['x-diffuser-from-promise'],
            index: +request.headers['x-diffuser-from-index']
        },
        to: {
            promise: request.headers['x-diffuser-to-promise'],
            index: +request.headers['x-diffuser-to-index']
        }
    }
    async(function () {
        this.olio.wait(async())
        this._names.wait(message.to.promise, async())
    }, function (olio, name) {
        // TODO Pluck name from association or else destroy socket.
        olio.sibling(name, async())
    }, function (sibling) {
        descendent.up(sibling.paths[message.to.index], 'diffuser:socket', message, socket)
    })
})

module.exports = Socketeer
