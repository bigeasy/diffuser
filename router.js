var logger = require('prolific.logger').createLogger('diffuser')
var Interrupt = require('interrupt').createInterrupter('diffuser')
var coalesce = require('extant')
var Procession = require('procession')

function noop () {}

function locate (stringified, address) {
    this._locations[stringified] = address
}

function RouteBucket(router, promise) {
    this._router = router
    this._promise = promise
}

RouteBucket.prototype.locate = noop

// TODO Reroute if we're the wrong worker index.
RouteBucket.prototype.push = function (envelope) {
    logger.notice('rerouted', { route: [ this._router._client.hostname ] , gatherer: envelope.gatherer })
    var promise = this._router._buckets[envelope.hashed.hash % this._router._buckets.length]
    // TODO Come back and account for hops. Why not?
    this._router._client.push({
        destination: envelope.destination,
        method: envelope.method,
        promise: this._promise,
        gatherer: envelope.gatherer,
        from: envelope.from,
        to: {
            promise: promise,
            index: envelope.hashed.hash % this._router._counts[promise]
        },
        hashed: envelope.hashed,
        body: envelope.body
    })
}

RouteBucket.prototype.ready = noop

RouteBucket.prototype.drop = noop

function WaitingBucket (router, buckets, index, promise) {
    this._router = router
    this._promise = promise
    this._route = buckets
    this._index = index
    this._queue = new Procession
    this._shifter = this._queue.shifter()
    this._waiting = []
    this._locations = {}
}

WaitingBucket.prototype.locate = locate

WaitingBucket.prototype.push = function (envelope) {
    this._queue.push(envelope)
}

WaitingBucket.prototype.ready = function () {
    var bucket = this._route[this._index] = new ActiveBucket(this._router, this._locations, this._promise)
    var envelope = null
    while ((envelope = this._shifter.shift()) != null) {
        bucket.push(envelope)
    }
}

WaitingBucket.prototype.drop = function (bucket) {
    var envelope = null
    while ((envelope = this._shifter.shift()) != null) {
        bucket.push(envelope)
    }
    for (var stringified in this._locations) {
        bucket.locate(stringified, this._locations[stringified])
    }
}

function ActiveBucket (router, locations, promise) {
    this._router = router
    this._locations = locations
    this._rerouter = new RouteBucket(router, promise)
}

ActiveBucket.prototype.locate = locate

ActiveBucket.prototype.push = function (envelope) {
    var count = this._router._counts[this._router._self.promise]
    var index = envelope.hashed.hash % count
    if (index != this._router._self.index) {
        this._rerouter.push(envelope)
        return
    }
    switch (envelope.destination) {
    case 'router':
        switch (envelope.method) {
        case 'register':
            this._locations[envelope.hashed.stringified] = envelope.from
            this._router._client.push({
                gatherer: envelope.gatherer,
                method: 'respond',
                destination: 'source',
                hashed: envelope.hashed,
                from: envelope.from,
                to: envelope.from,
                status: 'received',
                cookie: envelope.cookie
            })
            break
        case 'unregister':
            if (this._locations[envelope.hashed.stringified] == envelope.from) {
                delete this._locations[envelope.hashed.stringified] == envelope.from
            }
            this._router._client.push({
                gatherer: envelope.gatherer,
                method: 'respond',
                destination: 'source',
                hashed: envelope.hashed,
                from: envelope.from,
                to: envelope.from,
                status: 'received',
                cookie: envelope.cookie
            })
            break
        default:
            this._router._actor.act(this._router._client, envelope)
        }
        break
    case 'sink':
        var address = this._locations[envelope.hashed.stringified]
        if (address == null) {
            logger.notice('missing', { route: [ this._router._client.hostname ], gatherer: envelope.gatherer })
            this._router._client.push({
                destination: 'source',
                gatherer: envelope.gatherer,
                from: envelope.from,
                to: envelope.from,
                // TODO hashed: envelope.hashed,
                method: 'response',
                body: { statusCode: 404 }
            })
        } else {
            logger.notice('forwarded', { route: [ this._router._client.hostname ], gatherer: envelope.gatherer })
            this._router._client.push({
                gatherer: envelope.gatherer,
                from: envelope.from,
                to: address,
                hashed: envelope.hashed,
                method: 'receive',
                cookie: envelope.cookie,
                body: envelope.body
            })
        }
        break
    }
}

ActiveBucket.prototype.ready = noop

ActiveBucket.prototype.drop = noop

function Router (actor, client, self) {
    this._actor = actor
    this._client = client
    this._self = self
    this._route = []
}

Router.prototype.locate = function (hashed, value) {
    Interrupt.assert(this._route.length != 0, 'no.buckets')
    this._route[hashed.hash % this._route.length].locate(hashed.stringified, value)
}

Router.prototype.push = function (envelope) {
    if (this._route.length == 0) {
        logger.notice('dropped', { route: [ this._client.hostname ] , gatherer: envelope.gatherer })
    } else {
        this._route[envelope.hashed.hash % this._route.length].push(envelope)
    }
}

Router.prototype.setRoutes = function (promise, buckets, counts) {
    this._counts = counts
    this._buckets = buckets
    var updated = []
    for (var i = 0, I = buckets.length; i < I; i++) {
        if (this._self.promise == buckets[i]) {
            updated[i] = new WaitingBucket(this, updated, i, promise)
        } else {
            updated[i] = new RouteBucket(this, promise)
        }
        if (this._route[i] != null) {
            this._route[i].drop(updated[i])
        }
    }
    this._route = updated
}

Router.prototype.ready = function () {
    this._route.forEach(function (bucket) { bucket.ready() })
}

module.exports = Router
