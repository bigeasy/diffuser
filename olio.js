var Consensus = require('./consensus')
var Conference = require('compassion.conference')
var Compassion = require('compassion.colleague/compassion')(Conference)

var ISLAND = 'diffuser'

var coalesce = require('extant')

var destroyer = require('server-destroy')
var http = require('http')
var Middleware = require('./middleware')
var Downgrader = require('downgrader')

var Vivifyer = require('vivifyer')
var cadence = require('cadence')
var delta = require('delta')
var restrictor = require('restrictor')
var Turnstile = require('turnstile')

var Middleware = require('./middleware')

var Cubbyhole = require('cubbyhole')

function Service (destructible, olio, properties) {
    this._regsitrations = new Vivifyer(function () { return { count: 0 } })
    this._olio = olio
    this._location = 'http://' + properties.hostname + ':' + properties.port + '/'

    var property = coalesce(properties.property, 'diffuser')
    var siblings = {}

    for (var name in olio.siblings) {
        var sibling = olio.siblings[name]
        if (sibling.properties[property]) {
            siblings[name] = sibling.properties[property]
        }
    }

    this._configuration = {
        location: 'http://' + properties.location.hostname + ':' + properties.location.port + '/',
        siblings: siblings
    }

    this._properties = new Cubbyhole

    this.turnstile = new Turnstile
    destructible.destruct.wait(this.turnstile, 'destroy')
    this.turnstile.listen(destructible.durable('turnstile'))

    var register = this.register.bind(this)
    olio.on('diffuser:register', register)
    destructible.destruct.wait(olio.removeListener.bind(olio, 'diffuser:register', register))

    this._destructible = destructible
}

Service.prototype._setRoutes = function (routes) {
    for (var promise in routes.properties) {
        this._properties.set(promise, null, routes.properties[promise])
    }
    this._olio.broadcast(routes.properties[promise].name, 'diffuser:routes', routes)
    this._properties.keys().forEach(function (promise) {
        if (routes.properties[promise] == null) {
            this._properties.remove(promise)
        }
    }, this)
}

// Confused as to whether there are multiple islands implying multiple
// applications running through a single diffuser listener. I'm going to say
// that there is only a single island and that the island name and islander id
// are both specified as properties to the Diffuser's Olio child.
//
// And yet there's nothing preventing this from being a property of…
//
// Oh, I got a good idea. Maybe properties are exposed to everyone.

//
Service.prototype._embark = cadence(function (async, destructible, message) {
    var properties = this._configuration.siblings[message.name]
    var consensus = new Consensus(properties.buckets)
    async(function () {
        destructible.durable('consensus', consensus.routes.pump(this, function (routes) {
            if (routes != null) {
                this._setRoutes(routes)
            }
        }), 'destructible', async())
    }, function () {
        console.log('CONFIGURATION', properties, message)
        destructible.durable('compassion', Compassion, this._olio, consensus, properties.island, properties.id, {
            location: this._configuration.location,
            name: message.name,
            isRouter: properties.isRouter,
            count: this._olio.siblings[message.name].count
        }, async())
    })
})

Service.prototype.register = function (message) {
    console.log('registered', message)
    var counter = this._regsitrations.get(message.name)
    if (++counter.count == this._olio.siblings[message.name].count) {
        this._regsitrations.remove(message.name)
        this._destructible.durable([ 'embark', message ], this, '_embark', message, null)
    }
}

// Consume downgraded raw sockets created by the HTTP server. We look at the
// headers to determine the destination child and route to that child.

//
Service.prototype.socket = restrictor.push('message', cadence(function (async, request, socket) {
    var message = {
        from: {
            promise: request.headers['x-diffuser-from-promise'],
            index: +request.headers['x-diffuser-from-index']
        },
        to: {
            promise: request.headers['x-diffuser-to-promise'],
            index: +request.headers['x-diffuser-to-index']
        }
    }
    async(function () {
        this._properties.wait(message.to.promise, async())
    }, function (properties) {
        console.log('GOT A SOCKET', properties, message)
        this._olio.send(properties.name, message.to.index, 'diffuser:socket', message, socket)
    })
}))

module.exports = cadence(function (async, destructible, olio, properties) {
    // Construct our service.
    var service = new Service(destructible, olio, properties)

    // Construct our HTTP socket downgrading server and have it feed new sockets
    // to our service.
    var middleware = new Middleware
    var downgrader = new Downgrader
    var server = http.createServer(middleware.reactor.middleware)
    server.on('upgrade', downgrader.upgrade.bind(downgrader))
    downgrader.on('socket', service.socket.bind(service))
    async(function () {
        server.listen(properties.bind.port, properties.bind.iface)
        destroyer(server)
        delta(async()).ee(server).on('listening')
    }, function () {
        destructible.destruct.wait(server, 'destroy')
        delta(destructible.durable('http')).ee(server).on('close')
        return null
    })
})
