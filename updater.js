var cadence = require('cadence')

var Turnstile = require('turnstile')
Turnstile.Queue = require('turnstile/queue')

var Signal = require('signal')

var descendent = require('foremost')('descendent')

function Updater (destructible, socketeer) {
    descendent.increment()
    destructible.destruct.wait(descendent, 'decrement')
    this.turnstile = new Turnstile
    this.olio = new Signal
    this._socketeer = socketeer
    this.turnstile.listen(destructible.monitor('turnstile'))
    this._queue = new Turnstile.Queue(this, '_update', this.turnstile)
}

Updater.prototype._update = cadence(function (async, envelope) {
    var names = {}
    for (var promise in envelope.body.properties) {
        names[promise] = envelope.body.properties[promise].name
    }
    this._socketeer.setNames(names)
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

module.exports = cadence(function (async, destructible, socketeer) {
    return new Updater(destructible, socketeer)
})
