var Turnstile = require('turnstile')
Turnstile.Queue = require('turnstile/queue')

var logger = require('prolific.logger').createLogger('diffuser')

var cadence = require('cadence')

function Actor (destuctible, f) {
    this._f = f
    this.turnstile = new Turnstile
    this.turnstile.listen(destuctible.monitor('actor'))
    destuctible.destruct.wait(this.turnstile, 'close')
    this._queue = new Turnstile.Queue(this, '_act', this.turnstile)
}

Actor.prototype.act = function (client, envelope) {
    this._queue.push({ client: client, envelope: envelope })
}

Actor.prototype._act = cadence(function (async, envelope) {
    var client = envelope.body.client, envelope = envelope.body.envelope
    async([function () {
        async(function () {
            this._f.call(null, envelope.body, async())
        }, [], function (values) {
            client.push({
                gatherer: envelope.gatherer,
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
        client.push({
            gatherer: envelope.gatherer,
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

module.exports = Actor
