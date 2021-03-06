var coalesce = require('extant')

var Turnstile = require('turnstile')
Turnstile.Queue = require('turnstile/queue')

var logger = require('prolific.logger').createLogger('diffuser')

var cadence = require('cadence')

function Actor (destuctible, f) {
    this._f = f
    this.turnstile = new Turnstile
    this.turnstile.health.turnstiles = 1024
    this.turnstile.listen(destuctible.durable('turnstile'))
    destuctible.destruct.wait(this.turnstile, 'destroy')
    this._queue = new Turnstile.Queue(this, '_act', this.turnstile)
}

Actor.prototype.setRouter = function (router) {
    this._router = router
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
                promise: this._router.promise,
                module: 'diffuser',
                destination: 'source',
                method: 'respond',
                hashed: envelope.hashed,
                version: coalesce(envelope.version),
                index: coalesce(envelope.index),
                from: envelope.from,
                to: envelope.from,
                status: 'received',
                cookie: envelope.cookie,
                values: values,
                context: envelope.context
            })
        })
    }, function (error) {
        logger.error('error', { tag: [ 'actor' ], stack: error.stack })
        connector.push({
            promise: this._router.promise,
            module: 'diffuser',
            destination: 'source',
            method: 'respond',
            hashed: envelope.hashed,
            version: coalesce(envelope.version),
            index: coalesce(envelope.index),
            from: envelope.from,
            to: envelope.from,
            status: 'error',
            cookie: envelope.cookie,
            values: [ error.message ],
            context: envelope.context
        })
    }])
})

module.exports = cadence(function (async, destructible, f) {
    if (typeof f != 'function') {
        f = function (envelope, callback) { callback(null, null) }
    }
    return new Actor(destructible, f)
})
