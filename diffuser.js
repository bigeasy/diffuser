var Cliffhanger = require('cliffhanger')
var Signal = require('signal')

var Interrupt = require('interrupt').createInterrupter('diffuser')

var Actor = require('./actor')
var Connector = require('./connector')
var Registrar = require('./registrar')
var Requester = require('./requester')
var Dispatcher = require('./dispatcher')
var Hash = require('./hash')

var cadence = require('cadence')
var coalesce = require('extant')

function Diffuser (destructible, olio, sibling, connector, receiver, options, callback) {
    var cliffhanger = new Cliffhanger
    this._registrar = new Registrar({
        index: options.olio.index,
        cliffhanger: cliffhanger,
        connector: connector
    })
    this._dispatcher = new Dispatcher({
        index: options.olio.index,
        cliffhanger: cliffhanger,
        connector: connector,
        registrar: this._registrar,
        receiver: receiver
    })
    this._requester = new Requester({
        index: options.olio.index,
        cliffhanger: cliffhanger,
        timeout: 5000, // TODO Pass in.
        Hash: Hash,
        connector: connector,
        registrar: this._registrar
    })
    this._connector = connector

    var dispatch = this._dispatcher.dispatch.bind(this._dispatcher)
    var inbox = this._connector.inbox.pump(dispatch, destructible.durable('inbox'))
    destructible.destruct.wait(inbox, 'destroy')

    var socket = this._connector.socket.bind(this._connectee)
    olio.on('diffuser:socket', socket)
    destructible.destruct.wait(function () {
        olio.removeListener('diffuser:socket', socket)
    })
    olio.send(sibling.name, 0, 'diffuser:ready', {
        name: options.olio.name,
        index: options.olio.index,
        isRouter: !! options.router
    })

    var setRoutes = this._setRoutes.bind(this)
    olio.on('diffuser:routes', setRoutes)
    destructible.destruct.wait(function () {
        olio.removeListener('diffuser:routes', setRoutes)
    })

    this._ready = new Signal
    destructible.destruct.wait(this._ready.unlatch.bind(this._ready, new Interrupt('unready')))
    this._ready.wait(callback)
}

Diffuser.prototype._setRoutes = function (message) {
    this._dispatcher.setRoutes(message.body)
    this._connector.setRoutes(message.body)
    this._requester.setRoutes(message.body)
    this._registrar.setRoutes(message.body)
    this._ready.unlatch(null, this._requester)
    this._registrar.synchronize()
}

module.exports = cadence(function (async, destructible, options) {
    var diffuserName = coalesce(options.diffuserName, 'diffuser')
    async(function () {
        options.olio.sibling(diffuserName, async())
        destructible.durable('connector', Connector, options.olio.index, async())
        destructible.durable('receiver', Actor, options.receiver, async())
    }, function (sibling, connector, receiver) {
        new Diffuser(destructible, options.olio, sibling, connector, receiver, options, async())
    })
})
