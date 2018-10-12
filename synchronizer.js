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
    this._client = client
}

Synchronizer.prototype._synchronize = cadence(function (async, envelope) {
    console.log('poppped')
    async(function () {
        async.forEach(function (promise) {
            var count = envelope.body.counts[promise]
            var loop = async(function () {
                console.log(count, envelope.body)
                if (count-- == 0) {
                    return [ loop.break ]
                }
                this._client.push({
                    to: { promise: promise, index: count },
                    from: envelope.body.from,
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
