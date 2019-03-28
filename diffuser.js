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
        connector: connector,
        buckets: options.buckets
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
        timeout: coalesce(options.timeout, 5000),
        Hash: Hash,
        connector: connector,
        registrar: this._registrar
    })
    this._connector = connector

    destructible.durable('dispatch', this._connector.inbox.pump(this._dispatcher, 'dispatch'), 'destructible', null)

    var socket = this._connector.socket.bind(this._connector)
    olio.on('diffuser:socket', socket)
    destructible.destruct.wait(function () {
        olio.removeListener('diffuser:socket', socket)
    })
    olio.send(sibling.name, 0, 'diffuser:register', {
        name: options.olio.name,
        index: options.olio.index,
        isRouter: !! options.router
    })

    var setRoutes = this._setRoutes.bind(this)
    olio.on('diffuser:routes', setRoutes)
    destructible.destruct.wait(function () {
        olio.removeListener('diffuser:routes', setRoutes)
    })

    this._expirator = setInterval(this._requester.expire.bind(this._requester), 1000)

    destructible.destruct.wait(this, function () {
        clearInterval(this._expirator)
    })

    this._ready = new Signal
    destructible.destruct.wait(this._ready.unlatch.bind(this._ready, new Interrupt('unready')))
    this._ready.wait(callback)
}

Diffuser.prototype._setRoutes = function (message) {
    console.log('got routes', message)
    this._dispatcher.setRoutes(message)
    this._connector.setRoutes(message)
    this._requester.setRoutes(message)
    this._registrar.setRoutes(message)
    this._ready.unlatch(null, this._requester)
    this._registrar.synchronize()
}

module.exports = cadence(function (async, destructible, options) {
    var diffuserName = coalesce(options.diffuserName, 'diffuser')
    async(function () {
        options.olio.ready(diffuserName, async())
        destructible.durable('connector', Connector, options.olio.index, async())
        destructible.durable('receiver', Actor, options.receiver, async())
    }, function (sibling, connector, receiver) {
        console.log('DIFFUSER READY')
        new Diffuser(destructible, options.olio, sibling, connector, receiver, options, async())
    })
})
