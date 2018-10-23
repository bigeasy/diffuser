var cadence = require('cadence')
var descendent = require('foremost')('descendent')
var Connectee = require('./connectee')
var Synchronizer = require('./synchronizer')
var Connector = require('./connector')
var Client = require('./client')
var coalesce = require('extant')
var Signal = require('signal')
var Interrupt = require('interrupt').createInterrupter('diffuser')
var Hash = require('./hash')
var Router = require('./router')
var Cliffhanger = require('cliffhanger')
var Actor = require('./actor')

var Counter = require('./counter')

function Diffuser (destructible, connector, connectee, visited, received, options, callback) {
    var dispatch = dispatcher.dispatch.bind(dispatcher)
    var inbox = connectee.inbox.pump(dispatch, destructible.monitor('inbox'))
    destructible.destruct.wait(inbox, 'destroy')
    this._connectee = connectee
    this._synchronizer = synchronizer
    this._olio = options.olio
    this._diffuserName = coalesce(options.diffuserName, 'diffuser')
    this._isRouter = !! options.router
    this._client = null
    this._actors = {
        router: coalesce(options.router, cadence(function (async) { return null })),
        sink: coalesce(options.sink, cadence(function (async) { return null }))
    }
    this._actor = new Actor(destructible, this._actors.sink)
    var cliffhanger = new Cliffhanger
    this._client = new Client(connector)
    this._registrar = new Registrar({
        cliffhanger: cliffhanger,
        client: client
    })
    this._dispatcher = new Dispatcher({
        cliffhanger: this._cliffhanger,
        client: this._client,
        registrar: this._registrar,
        visited: visited,
        received: received
    })

    this._ready = new Signal
    this._ready.wait(callback)

    var socket = this._connectee.socket.bind(this._connectee)
    descendent.on('diffuser:socket', socket)
    destructible.destruct.wait(function () {
        descendent.removeListener('diffuser:socket', socket)
    })
    descendent.up(sibling.paths[0], 'diffuser:ready', {
        name: this._olio.name,
        index: this._olio.index,
        isRouter: this._isRouter
    })

    var setRoutes = this._setRoutes.bind(this)
    destructible.destruct.wait(this._ready.unlatch.bind(this._ready, new Interrupt('unready')))
    descendent.on('diffuser:routes', setRoutes)
    destructible.destruct.wait(function () {
        descendent.removeListener('diffuser:routes', setRoutes)
    })
}

Diffuser.prototype._setRoutes = function (message) {
    this._dispatcher.setRoutes(message)
    this._client.setRoutes(message)
    this._connector.setRoutes(message)
    this._requester.setRoutes(message)
    this._registrar.setRoutes(message)
    this._ready.unlatch(null, this)
}

Diffuser.prototype._ready = cadence(function (async, destructible) {
    async(function () {
        this._olio.sibling(this._diffuserName, async())
    }, function (sibling) {
        // The diffuser process is definately listening because it registered
        // itself prior to starting Olio.
        ready.wait(async())
    }, function () {
        return this
    })
})

module.exports = cadence(function (async, destructible, options) {
    var diffuserName = coalesce(options.diffuserName, 'diffuser')
    async(function () {
        options.olio.sibling(diffuserName, async())
    }, function (sibling) {
        descendent.increment()
        destructible.destruct.wait(descendent, 'decrement')
        destructible.monitor('connectee', Connectee, async())
        destructible.monitor('connector', Connector, options.olio.index, async())
        destructible.monitor('visited', Actor, options.router, async())
        destructible.monitor('received', Actor, options.receiver, async())
    }, function (connector, conectee, visited, received) {
        new Diffuser(destructible, connectee, connectee, visited, received, options, async())
    })
})
