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

function Diffuser (destructible, sibling, connector, visitor, receiver, options, callback) {
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
        visitor: visitor,
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
    var inbox = this._connector.inbox.pump(dispatch, destructible.monitor('inbox'))
    destructible.destruct.wait(inbox, 'destroy')

    var socket = this._connector.socket.bind(this._connectee)
    descendent.on('diffuser:socket', socket)
    destructible.destruct.wait(function () {
        descendent.removeListener('diffuser:socket', socket)
    })
    descendent.up(sibling.paths[0], 'diffuser:ready', {
        name: options.olio.name,
        index: options.olio.index,
        isRouter: !! options.router
    })

    var setRoutes = this._setRoutes.bind(this)
    descendent.on('diffuser:routes', setRoutes)
    destructible.destruct.wait(function () {
        descendent.removeListener('diffuser:routes', setRoutes)
    })

    this._ready = new Signal
    destructible.destruct.wait(this._ready.unlatch.bind(this._ready, new Interrupt('unready')))
    this._ready.wait(callback)
}

Diffuser.prototype._setRoutes = function (message) {
}

Diffuser.prototype.message = cadence(function (async, envelope) {
    if (envelope.body.message.module == 'diffuser') {
        switch (envelope.body.message.method) {
        case 'socket':
            this._connector.socket(envelope.body.message, envelope.body.socket)
            break
        case 'routes':
            this._dispatcher.setRoutes(message.body)
            this._connector.setRoutes(message.body)
            this._requester.setRoutes(message.body)
            this._registrar.setRoutes(message.body)
            this._ready.unlatch(null, this._requester)
            this._registrar.synchronize()
            break
        }
    }
})

module.exports = cadence(function (async, destructible, options) {
    var diffuserName = coalesce(options.diffuserName, 'diffuser')
    async(function () {
        options.olio.sibling(diffuserName, async())
        destructible.monitor('connector', Connector, options.olio.index, async())
        destructible.monitor('visitor', Actor, options.router, async())
        destructible.monitor('receiver', Actor, options.receiver, async())
    }, function (sibling, connector, visitor, receiver) {
        new Diffuser(destructible, sibling, connector, visitor, receiver, options, async())
    })
})
