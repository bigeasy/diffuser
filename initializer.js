var Vivifyer = require('vivifyer')
var assert = require('assert')
var cadence = require('cadence')
var Signal = require('signal')

var Turnstile = require('turnstile')
Turnstile.Queue = require('turnstile/queue')

var descendent = require('foremost')('descendent')

var Procession = require('procession')

var restrictor = require('restrictor')

function Initializer (destructible, olio) {
    this.arrived = new Procession
    this.turnstile = new Turnstile
    this.turnstile.listen(destructible.monitor('turnstile'))
    this._messages = new Turnstile.Queue(this, '_message', this.turnstile)
    destructible.destruct.wait(this.turnstile, 'destroy')
    this._ready = new Vivifyer(function () {
        return { arrived: 0, properties: null }
    })
    this._olio = olio
    var message = this.message.bind(this)
    olio.on('diffuser:ready', message)
    destructible.destruct.wait(olio.removeListener.bind(olio, 'diffuser:ready', message))
}

Initializer.prototype.message = restrictor.push(cadence(function (async, envelope) {
        console.log(envelope)
    if (!envelope.canceled) {
        var message = envelope.body.shift()
        async(function () {
        console.log('arrived', message)
            this._olio.sibling(message.name, async())
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
    }
}))

module.exports = cadence(function (async, destructible, olio) {
    return new Initializer(destructible, olio)
})
