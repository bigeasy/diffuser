var Vivifyer = require('vivifyer')
var assert = require('assert')
var cadence = require('cadence')
var Signal = require('signal')

var Turnstile = require('turnstile')
Turnstile.Queue = require('turnstile/queue')

var descendent = require('foremost')('descendent')

var Departure = require('departure')

var Procession = require('procession')

function Synchronizer (destructible, client) {
    this.turnstile = new Turnstile
    this.queue = new Turnstile.Queue(this, '_synchronize', this.turnstile)
    this.turnstile.listen(destructible.monitor('synchronize'))
    destructible.destruct.wait(this.turnstile, 'close')
    this.registered = {}
    this._client = client
}

Synchronizer.prototype._synchronize = cadence(function (async, envelope) {
    async(function () {
        for (var stringified in this._registered) {
            var hashed = this._registered[stringified]
            var promise = envelope.buckets[hashed.hash % envelope.buckets.length]
            var index = hashed.hash % envelope.counts[promise].count
            this._client.push({
                to: { promise: promise, index: index },
                from: envelope.body.from,
                module: 'diffuser',
                method: 'synchronize',
                promise: envelope.body.promise,
                body: hashed
            })
        }
    }, function () {
        console.log('BODY', envelope.body)
        async.forEach(function (promise) {
            var count = envelope.body.counts[promise]
            var loop = async(function () {
                if (count-- == 0) {
                    return [ loop.break ]
                }
                console.log('sync >>>', envelope.body.from, { promise: promise, index: count })
                this._client.push({
                    from: envelope.body.from,
                    to: { promise: promise, index: count },
                    module: 'diffuser',
                    method: 'synchronize',
                    promise: envelope.body.promise,
                    body: null
                })
            })()
        })(envelope.body.buckets.filter(function (promise, index) {
            return index == envelope.body.buckets.indexOf(promise)
        }))
    })
})

module.exports = Synchronizer
