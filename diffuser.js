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

function Diffuser (destructible, connectee, synchronizer, options, callback) {
    var counter = new Counter
    var inbox = connectee.inbox.pump(function (envelope) {
        switch (envelope.method) {
        case 'synchronize':
            if (envelope.body == null && envelope.promise == this._routes.promise) {
                var count = 0
                for (var promise in this._routes.properties) {
                    count += this._routes.properties[promise].count
                }
                if (counter.increment(envelope.promise) == count) {
                    counter.updated(envelope.promise)
                    this._router.ready()
                }
            }
            break
        case 'respond':
            this._cliffhanger.resolve(envelope.cookie, [ null, envelope ])
            break
        case 'receive':
            this._actor.act(this._client, envelope)
            break
        }
    }.bind(this), destructible.monitor('inbox'))
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
    this._cliffhanger = new Cliffhanger
    this._ready(destructible, callback)
    this._timeout = coalesce(options.timeout)
    this._interval = setInterval(this._expire.bind(this))
    destructible.destruct.wait(this, function () { clearTimeout(this._interval) })
}

Diffuser.prototype._expire = function () {
    this._cliffhanger.expire(Date.now() - this._timeout, [ null, { status: 'timeout' } ])
}

Diffuser.prototype._initialize = cadence(function (async, destructible, ready, message) {
    this._from = { promise: message.body.self, index: this._olio.index }
    async(function () {
        destructible.monitor('connector', Connector, this._from, async())
    }, function (connector) {
        this._client = new Client(connector)
        this._synchronizer = new Synchronizer(destructible, this._client)
        var counts = {}, locations = {}
        for (var promise in message.body.properties) {
            locations[promise] = message.body.properties[promise].location
            counts[promise] = message.body.properties[promise].count
        }
        this._router = new Router(new Actor(destructible, this._actors.router), this._client, { promise: message.body.self, index: this._olio.index })
        this._router.setRoutes(message.body.self, message.body.buckets, counts)
        this._connector = connector
        this._connector.setLocations(locations)
        this._routes = message.body
        this._synchronizer.queue.push({
            promise: message.body.promise,
            from: this._from,
            buckets: message.body.buckets,
            counts: counts
        })
        ready.unlatch()
    })
})

Diffuser.prototype._ready = cadence(function (async, destructible) {
    destructible.destruct.wait(setImmediate.bind(null, destructible.monitor('placeholder')))
    async(function () {
        this._olio.sibling(this._diffuserName, async())
    }, function (sibling) {
        // The diffuser process is definately listening because it registered
        // itself prior to starting Olio.
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
        var ready = new Signal
        // destructible.destruct.wait(ready.unlatch.bind(ready, new Interrupt('unready')))
        destructible.destruct.wait(ready.unlatch.bind(ready, new Interrupt('unready')))
        descendent.on('diffuser:socket', function (message, socket) {
            ready.unlatch()
        }.bind(this))
        descendent.once('diffuser:routes', function (message) {
            descendent.on('diffuser:routes', function (message) {
                this._routes = message
            }.bind(this))
            this._initialize(destructible, ready, message, destructible.monitor('ready', true))
        }.bind(this))
        ready.wait(async())
    }, function () {
        return this
    })
})

Diffuser.prototype.register = cadence(function (async, key) {
    var hashed = Hash(key)
    var buckets = this._routes.buckets
    var promise = buckets[hashed.hash % buckets.length]
    var properties = this._routes.properties[promise]
    var to = { promise: promise, index: hashed.hash % properties.count }
    async(function () {
        this._router.push({
            destination: 'router',
            method: 'register',
            gatherer: null,
            from: this._from,
            hashed: hashed,
            cookie: this._cliffhanger.invoke(async())
        })
    }, function (response) {
        return response.status == 'received'
    })
})

Diffuser.prototype.unregister = cadence(function (async, key) {
    var hashed = Hash(key)
    var buckets = this._routes.buckets
    var promise = buckets[hashed.hash % buckets.length]
    var properties = this._routes.properties[promise]
    var to = { promise: promise, index: hashed.hash % properties.count }
    async(function () {
        this._router.push({
            destination: 'router',
            method: 'unregister',
            gatherer: null,
            from: this._from,
            hashed: hashed,
            cookie: this._cliffhanger.invoke(async())
        })
    }, function (response) {
        return response.status == 'received'
    })
})

Diffuser.prototype.route = cadence(function (async, destination, key, value) {
    var hashed = Hash(key)
    var buckets = this._routes.buckets
    var promise = buckets[hashed.hash % buckets.length]
    var properties = this._routes.properties[promise]
    var to = { promise: promise, index: hashed.hash % properties.count }
    async(function () {
        this._router.push({
            destination: destination,
            method: 'route',
            hashed: hashed,
            to: to,
            body: value,
            from: this._from,
            cookie: this._cliffhanger.invoke(async())
        })
    }, function (response) {
        return { status: response.status, values: response.values }
    })
})

module.exports = cadence(function (async, destructible, options) {
    descendent.increment()
    destructible.destruct.wait(descendent, 'decrement')
    async(function () {
        destructible.monitor('connectee', Connectee, async())
    }, function (connectee, synchronizer) {
        new Diffuser(destructible, connectee, synchronizer, options, async())
    })
})
