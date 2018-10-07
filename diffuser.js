var cadence = require('cadence')
var descendent = require('foremost')('descendent')
var Connectee = require('./connectee')
var coalesce = require('extant')
var Signal = require('signal')
var Interrupt = require('interrupt').createInterrupter('diffuser')

function Diffuser (destructible, connectee, options, callback) {
    this._connectee = connectee
    this._olio = options.olio
    this._diffuserName = coalesce(options.diffuserName, 'diffuser')
    this._isRouter = !! options.router
    this._router = coalesce(options.router, cadence(function (async) { return null }))
    this._terminus = coalesce(options.terminus, cadence(function (async) { return null }))
    this._ready(destructible, callback)
}

Diffuser.prototype._ready = cadence(function (async, destructible) {
    destructible.destruct.wait(setImmediate.bind(null, destructible.monitor('placeholder')))
    async(function () {
        this._olio.sibling(this._diffuserName, async())
    }, function (sibling) {
        console.log(sibling)
        /*
        // The diffuser process is definately listening because it registered
        // itself prior to starting Olio.
        var socket = this._connectee.socket.bind(this._connectee)
        descendent.on('diffuser:socket', socket)
        destructible.destruct.wait(function () {
            descendent.removeListener('diffuser:socket', socket)
        })
        */
        descendent.up(sibling.paths[0], 'diffuser:ready', {
            name: this._olio.name,
            index: this._olio.index,
            isRouter: this._isRouter
        })
        var ready = new Signal
        // destructible.destruct.wait(ready.unlatch.bind(ready, new Interrupt('unready')))
        destructible.destruct.wait(ready.unlatch.bind(ready, new Interrupt('unready')))
        descendent.once('diffuser:arrived', function (message) {
            this.from = message.from
            ready.unlatch()
        }.bind(this))
        ready.wait(async())
    }, function () {
        return this
    })
})

Diffuser.prototype.register = cadence(function (async, key, value) {
    this._router.push({
        destination: 'router',
        method: 'register',
        from: from,
        gatherer: null,
        from: from,
        to: to,
        hashed: Hash(key),
        value: value,
        cookie: cookie
    })
})

module.exports = cadence(function (async, destructible, options) {
    descendent.increment()
    destructible.destruct.wait(descendent, 'decrement')
    async(function () {
        destructible.monitor('connectee', Connectee, async())
    }, function (connectee) {
        new Diffuser(destructible, connectee, options, async())
    })
})
