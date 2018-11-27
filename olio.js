var Consensus = require('./consensus')
var Conference = require('compassion.conference')
var Compassion = require('compassion.colleague/compassion')(Conference)

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

function Service (destructible, olio, properties) {
    this._regsitrations = new Vivifyer(function () { return { count: 0 } })
    this._olio = olio
    this._location = 'http://' + properties.hostname + ':' + properties.port + '/'

    this.turnstile = new Turnstile
    destructible.destruct.wait(this.turnstile, 'destroy')
    this.turnstile.listen(destructible.monitor('turnstile'))

    var register = this.register.bind(this)
    olio.on('diffuser:register', register)
    destructible.destruct.wait(olio.removeListener.bind(olio, 'diffuser:register', register))
}

Service.prototype._setRoutes = function (island, routes) {
    for (var promise in route.properties) {
        this._properties[island].set(promise, null, route.properties[promise])
        this._olio.broadcast(route.properties[promise].name, 'diffuser:routes', routes)
    }
    this._properties[island].keys().forEach(function (promise) {
        if (route.properties[promise] == null) {
            this._properties[island].remove(promise)
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
Service.prototype.embark = cadence(function (async, destructible, message) {
    this._properties[message.island] = new Cubbyhole
    var consensus = new Consensus(message.buckets)
    async(function () {
        destructible.monitor('consensus', consensus.routes.pump(this, function (route) {
            this._setRoutes(message.island, routes)
        }), 'destructible', async())
    }, function () {
        destructible.monitor('compassion', Compassion, olio, consensus, message.island, message.id, {
            location: this._location,
            name: message.name,
            isRouter: message.isRouter,
            count: message.count
        }, async())
    })
})

Service.prototype.register = function (message) {
    var counter = this._regsitrations.get(message.name)
    if (++counter.count == this._olio.counts[message.name]) {
        this._regsitrations.remove(message.name)
        this._destructible.monitor([ 'embark', message ], this, '_embark', message, null)
    }
}

// Consume downgraded raw sockets created by the HTTP server. We look at the
// headers to determine the destination child and route to that child.

//
Service.prototype.socket = restrictor.push('message', cadence(function (async, request, socket) {
    var message = {
        from: {
            island: request.headers['x-diffuser-from-island'],
            promise: request.headers['x-diffuser-from-promise'],
            index: +request.headers['x-diffuser-from-index']
        },
        to: {
            island: request.headers['x-diffuser-to-island'],
            promise: request.headers['x-diffuser-to-promise'],
            index: +request.headers['x-diffuser-to-index']
        }
    }
    async(function () {
        this._properties[message.to.island].wait(message.to.promise, async())
    }, function (properties) {
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
        server.listen(properties.port, properties.hostname)
        destroyer(server)
        delta(async()).ee(server).on('listening')
    }, function () {
        destructible.destruct.wait(server, 'destroy')
    })

    return null
})
