// Control-flow utilities.
var cadence = require('cadence')

// Node.js API.
var assert = require('assert')
var crypto = require('crypto')

// Evented map.
var Cubbyhole = require('cubbyhole')

// Convert an error-first callback into a cookie.
var Cliffhanger = require('cliffhanger')

// Error-first callback interface to HTTP.
var UserAgent = require('vizsla')

// Evented work queue.
var Turnstile = require('turnstile')
Turnstile.Queue = require('turnstile/queue')

// Bind an object to Sencha Connect middleware.
var Reactor = require('reactor')

// Logging pipeline.
var logger = require('prolific.logger').createLogger('addendum')

function Diffuser (compassionUrl) {
    this.nodes = {}
    this._index = 0
    this._cliffhanger = new Cliffhanger
    this._compassionUrl = compassionUrl
    this._cubbyholes = new Cubbyhole
    this._ua = new UserAgent
    this.broadcaster = new Turnstile.Queue(this, '_broadcast', new Turnstile)
    this.reactor = new Reactor(this, function (dispatcher) {
        dispatcher.dispatch('GET /', 'index')
        dispatcher.dispatch('GET /ping', 'ping')
        dispatcher.dispatch('POST /register', 'register')
        dispatcher.dispatch('POST /arrive', 'arrive')
        dispatcher.dispatch('POST /acclimated', 'acclimated')
        dispatcher.dispatch('POST /join', 'join')
        dispatcher.dispatch('POST /backlog', 'backlog')
        dispatcher.dispatch('POST /receive/set', 'receiveSet')
        dispatcher.dispatch('POST /reduced/set', 'reducedSet')
        dispatcher.dispatch('POST /receive/remove', 'receiveRemove')
        dispatcher.dispatch('POST /reduced/remove', 'reducedRemove')
        dispatcher.dispatch('POST /depart', 'depart')
    })
}

Diffuser.prototype.index = cadence(function (async) {
    return [ 200, { 'content-type': 'text/plain' }, 'Diffuser Consensus API\n' ]
})

Diffuser.prototype.ping = cadence(function (async) {
    return 200
})

Diffuser.prototype.register = cadence(function (async, request) {
    this._token = request.body.token
    return 200
})

Diffuser.prototype.join = cadence(function (async, conference) {
    async(function () {
        this._ua.fetch({
            url: this._compassionUrl,
        }, {
            token: this._token,
            url: './backlog',
            parse: 'json',
            raise: true
        }, async())
    }, function (body) {
        this._table.join(body.addresses, body.buckets)
        return 200
    })
})

Diffuser.prototype.backlog = cadence(function (async, request) {
    async(function () {
       this._cubbyholes.wait(request.body.promise, async())
    }, function (stored) {
        return stored
    })
})

Diffuser.prototype.arrive = cadence(function (async, request) {
    console.log(request.body)
    this._cubbyholes.set(request.body.government.promise, null, JSON.parse(JSON.stringify({
        addresses: this._table.addresses,
        buckets: this._table.buckets
    })))
    this._table.arrive(request.body.government.promise)
    return 200
})

Diffuser.prototype.acclimated = cadence(function (async, request) {
    this._cubbyholes.remove(request.body.government.promise)
    return 200
})

Diffuser.prototype.depart = cadence(function (async, request) {
    this._cubbyholes.remove(request.body.departed.promise)
    this._table.depart(request.body.departed.promise)
    delete this._locations[request.body.departed.promise]
    this.queue.push(JSON.parse(JSON.stringify({
        locations: this._locations,
        addresses: this._table.addresses,
        buckets: this._table.buckets
    })))
    return 200
})

module.exports = Diffuser
