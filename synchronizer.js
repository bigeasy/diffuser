var Vivifyer = require('vivifyer')
var assert = require('assert')
var cadence = require('cadence')
var Signal = require('signal')

var Turnstile = require('turnstile')
Turnstile.Queue = require('turnstile/queue')

var descendent = require('foremost')('descendent')

var Departure = require('departure')

var Procession = require('procession')

var Router = require('./lookup')

function Synchronizer (destructible, buckets) {
    this.turnstile = new Turnstile
    this.queue = new Turnstile.Queue(this, '_synchronize', this.turnstile)
    this.turnstile.listen(destructible.monitor('synchronize'))
    destructible.destruct.wait(this.turnstile, 'close')
    this.registered = {}
    this._locations = Array.apply(null, new Array(buckets)).map(Object)
}

Synchronizer.prototype.register = function (hashed) {
    this._locations[hashed.hash % this._locations.length][hashed.stringified] = hashed
}

Synchronizer.prototype.contains = function (hashed) {
    return !! this._locations[hashed.hash % this._locations.length][hashed.stringified]
}

function transfer (router, client, map, from) {
    for (var stringified in map) {
        var hashed = map[stringified]
        client.push({
            module: 'diffuser',
            method: 'synchronize',
            to: router.route(hashed),
            from: from,
            promise: router.routes.promise,
            body: hashed
        })
    }
}

Synchronizer.prototype.synchronize = function (from, client, routes) {
    var router = new Router(routes)
    if (routes.event.action == 'arrive') {
        this._locations.forEach(function (map, index) {
            if (routes.buckets[index] == routes.event.promise) {
                transfer(router, client, map, from)
            }
        })
    } else {
        this._locations.forEach(function (map, index) {
            for (var stringified in map) {
                transfer(router, client, map)
            }
        })
    }
    for (var promise in routes.properties) {
        var count = routes.properties[promise].count
        for (var index = 0; index < count; index++) {
            client.push({
                from: from,
                to: { promise: promise, index: count },
                module: 'diffuser',
                method: 'synchronize',
                promise: routes.promise,
                body: null
            })
        }
    }
}

module.exports = Synchronizer
