var cadence = require('cadence')

var Turnstile = require('turnstile')
Turnstile.Queue = require('turnstile/queue')

var Signal = require('signal')

var descendent = require('foremost')('descendent')

function Updater (destructible) {
    descendent.increment()
    destructible.destruct.wait(descendent, 'decrement')
    this.turnstile = new Turnstile
    this.olio = new Signal
    this.turnstile.listen(destructible.monitor('turnstile'))
    this._queue = new Turnstile.Queue(this, '_update', this.turnstile)
}

Updater.prototype._update = cadence(function (async, envelope) {
    var message = envelope.body
    var properties = message.properties[message.self]
    async(function () {
        this.olio.wait(async())
    }, function (olio) {
        async(function () {
            olio.sibling(properties.name, async())
        }, function (sibling) {
            sibling.paths.forEach(function (path) {
                descendent.up(path, 'diffuser:routes', envelope.body)
            })
        })
    })
})

Updater.prototype.push = function (message) {
    this._queue.push(message)
}

module.exports = cadence(function (async, destructible) {
    return new Updater(destructible)
})
