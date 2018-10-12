var logger = require('prolific.logger').createLogger('diffuser')
var Interrupt = require('interrupt').createInterrupter('diffuser')
var coalesce = require('extant')
var Procession = require('procession')

function noop () {}

function locate (stringified, address) {
    this._locations[stringified] = address
}

function RouteBucket(client, promise, buckets, counts) {
    this._client = client
    this._promise = promise
    this._buckets = buckets
    this._counts = counts
}

RouteBucket.prototype.locate = noop

// TODO Reroute if we're the wrong worker index.
RouteBucket.prototype.push = function (envelope) {
    logger.notice('rerouted', { route: [ this._client.hostname ] , gatherer: envelope.gatherer })
    var promise = this._buckets[envelope.hashed.hash % this._buckets.length]
    // TODO Come back and account for hops. Why not?
    this._client.push({
        promise: this._promise,
        gatherer: envelope.gatherer,
        from: envelope.from,
        to: {
            promise: promise,
            index: envelope.hashed.hash % this._counts[promise]
        },
        hashed: envelope.hashed,
        type: 'request',
        body: envelope.body
    })
}

RouteBucket.prototype.ready = noop

RouteBucket.prototype.drop = noop

function WaitingBucket (f, client, buckets, index) {
    this._f = f
    this._client = client
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
    var bucket = this._route[this._index] = new ActiveBucket(this._f, this._client, this._locations)
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

function ActiveBucket (f, client, locations) {
    this._f = f
    this._client = client
    this._locations = locations
}

ActiveBucket.prototype.locate = locate

ActiveBucket.prototype.push = function (envelope) {
    switch (envelope.destination) {
    case 'router':
        switch (envelope.method) {
        case 'register':
            this._locations[envelope.hashed.stringified] = envelope.from
            this._client.push({
                gatherer: envelope.gatherer,
                method: 'respond',
                destination: 'source',
                from: envelope.from,
                to: envelope.from,
                status: 'received',
                cookie: envelope.cookie
            })
            break
        default:
            this._f.call(null, envelope)
        }
        break
    case 'terminus':
        var address = this._locations[envelope.hashed.stringified]
        if (address == null) {
            logger.notice('missing', { route: [ this._client.hostname ], gatherer: envelope.gatherer })
            this._client.push({
                gatherer: envelope.gatherer,
                from: envelope.from,
                to: envelope.from,
                // TODO hashed: envelope.hashed,
                type: 'response',
                body: { statusCode: 404 }
            })
        } else {
            logger.notice('forwarded', { route: [ this._client.hostname ], gatherer: envelope.gatherer })
            this._client.push({
                gatherer: envelope.gatherer,
                from: envelope.from,
                to: address,
                hashed: envelope.hashed,
                type: 'request',
                body: envelope.body
            })
        }
        break
    }
}

ActiveBucket.prototype.ready = noop

ActiveBucket.prototype.drop = noop

function Router (f, client, identifier) {
    this._f = f
    this._client = client
    this._identifier = identifier
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
        if (this._identifier == buckets[i]) {
            updated[i] = new WaitingBucket(this._f, this._client, updated, i)
        } else {
            updated[i] = new RouteBucket(this._client, promise, buckets, counts)
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
