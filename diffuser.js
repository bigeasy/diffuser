var Cliffhanger = require('cliffhanger')
var Cache = require('magazine')
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
    var requests = new Cache().createMagazine()
    this._registrar = new Registrar({
        index: options.olio.index,
        cliffhanger: cliffhanger,
        connector: connector,
        buckets: options.buckets
    })
    this._dispatcher = new Dispatcher({
        index: options.olio.index,
        cliffhanger: cliffhanger,
        requests: requests,
        connector: connector,
        registrar: this._registrar,
        receiver: receiver
    })
    this._requester = new Requester({
        index: options.olio.index,
        cliffhanger: cliffhanger,
        requests: requests,
        timeout: coalesce(options.timeout, 5000),
        Hash: Hash,
        connector: connector,
        registrar: this._registrar
    })
    this._connector = connector

    destructible.durable('receive', this._connector.inbox.pump(this._dispatcher, 'receive'), 'destructible', null)

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
    var socket = function (message, socket) {
        socket.end()
        socket.destroy()
    }
    olio.on('diffuser:socket', socket)
    olio.once('diffuser:routes', function () {
        olio.removeListener('diffuser:socket', socket)
        socket = connector.socket.bind(connector)
        olio.on('diffuser:socket', socket)
    })
    destructible.destruct.wait(function () {
        olio.removeListener('diffuser:socket', socket)
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
    this._registrar.synchronize()
    this._ready.unlatch(null, this._requester)
}

module.exports = cadence(function (async, destructible, options) {
    var diffuserName = coalesce(options.diffuserName, 'diffuser')
    async(function () {
        options.olio.ready(diffuserName, async())
        destructible.durable('connector', Connector, options.olio.index, options.monkey, async())
        destructible.durable('receiver', Actor, options.receiver, async())
    }, function (sibling, connector, receiver) {
        new Diffuser(destructible, options.olio, sibling, connector, receiver, options, async())
    })
})
