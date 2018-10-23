var Turnstile = require('turnstile')
Turnstile.Queue = require('turnstile/queue')

var logger = require('prolific.logger').createLogger('diffuser')

var cadence = require('cadence')

function Actor (destuctible, f) {
    this._f = f
    this.turnstile = new Turnstile
    this.turnstile.listen(destuctible.monitor('turnstile'))
    destuctible.destruct.wait(this.turnstile, 'close')
    this._queue = new Turnstile.Queue(this, '_act', this.turnstile)
}

Actor.prototype.act = function (connector, envelope) {
    this._queue.push({ connector: connector, envelope: envelope })
}

Actor.prototype._act = cadence(function (async, envelope) {
    var connector = envelope.body.connector, envelope = envelope.body.envelope
    async([function () {
        async(function () {
            this._f.call(null, envelope.body, async())
        }, [], function (values) {
            connector.push({
                method: 'respond',
                destination: 'source',
                hashed: envelope.hashed,
                from: envelope.from,
                to: envelope.from,
                status: 'received',
                cookie: envelope.cookie,
                values: values
            })
        })
    }, function (error) {
        logger.error('error', { tag: [ 'actor' ], stack: error.stack })
        connector.push({
            method: 'respond',
            destination: 'source',
            hashed: envelope.hashed,
            from: envelope.from,
            to: envelope.from,
            status: 'error',
            cookie: envelope.cookie,
            values: [ error.message ]
        })
    }])
})

module.exports = cadence(function (async, destructible, f) {
    if (typeof f != 'function') {
        f = function (envelope, callback) { callback(null, null) }
    }
    return new Actor(destructible, f)
})
