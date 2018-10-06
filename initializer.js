var Vivifyer = require('vivifyer')
var assert = require('assert')
var cadence = require('cadence')
var Signal = require('signal')

var Turnstile = require('turnstile')
Turnstile.Queue = require('turnstile/queue')

var descendent = require('foremost')('descendent')

var Departure = require('departure')

var Procession = require('procession')

function Initializer (destructible) {
    descendent.increment()
    destructible.destruct.wait(descendent, 'decrement')
    this.olio = new Signal
    this.arrived = new Procession
    this.turnstile = new Turnstile
    this.turnstile.listen(destructible.monitor('turnstile'))
    destructible.destruct.wait(this.turnstile, 'close')
    this._messages = new Turnstile.Queue(this, '_message', this.turnstile)
    this._ready = new Vivifyer(function () {
        return { arrived: 0, properties: null }
    })
    descendent.on('diffuser:ready', this.message.bind(this))
}

Initializer.prototype._message = cadence(function (async, envelope) {
    var message = envelope.body
    async(function () {
        // TODO So hard to cancel all this stuff, but push an error through
        // please.
        this.olio.wait(async())
    }, function (olio) {
        olio.sibling(message.body.name, async())
    }, function (sibling) {
        var counter = this._ready.get(message.body.name)
        if (counter.arrived == 0) {
            counter.isRouter = message.body.isRouter
        } else {
            assert(counter.isRouter == message.body.isRouter)
        }
        if (++counter.arrived == sibling.count) {
            this.arrived.push({
                name: message.body.name,
                isRouter: message.body.isRouter,
                count: sibling.count
            })
        }
    })
})

Initializer.prototype.message = function (message) {
    console.log(message)
    this._messages.push(message)
}

module.exports = cadence(function (async, destructible) {
    return new Initializer(destructible)
})
