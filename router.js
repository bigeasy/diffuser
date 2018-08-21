var logger = require('prolific.logger').createLogger('diffuser')
var Interrupt = require('interrupt').createInterrupter('diffuser')
var coalesce = require('extant')
var Procession = require('procession')

function noop () {}

function locate (hashed, address) {
    this._locations[hashed.stringified] = address
}

function RouteBucket(client, address) {
    this._client = client
    this._address = address
}

RouteBucket.prototype.locate = noop

// TODO Reroute if we're the wrong worker index.
RouteBucket.prototype.push = function (envelope) {
    logger.notice('rerouted', { route: [ this._client.hostname ] , gatherer: envelope.gatherer })
    // TODO Come back and account for hops. Why not?
    this._client.push({
        gatherer: envelope.gatherer,
        from: envelope.from,
        to: this._address,
        hashed: envelope.hashed,
        type: 'request',
        body: envelope.body
    })
}

RouteBucket.prototype.ready = noop

RouteBucket.prototype.drop = noop

function WaitingBucket (client, buckets, index) {
    this._client = client
    this._buckets = buckets
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
    var bucket = this._buckets[this._index] = new ActiveBucket(this._client, this._locations)
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
}

function ActiveBucket (client, locations) {
    this._client = client
    this._locations = locations
}

ActiveBucket.prototype.locate = locate

ActiveBucket.prototype.push = function (envelope) {
    var address = this._locations[envelope.hashed.stringified]
    if (address == null) {
        logger.notice('missing', { route: [ this._client.hostname ], gatherer: envelope.gatherer })
        this._client.push({
            gatherer: envelope.gatherer,
            from: envelope.from,
            to: envelope.from,
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
}

ActiveBucket.prototype.ready = noop

ActiveBucket.prototype.drop = noop

function Router (client, identifier) {
    this._client = client
    this._idenifier = identifier
    this._buckets = []
}

Router.prototype.locate = function (hashed, value) {
    Interrupt.assert(this._buckets.length != 0, 'no.buckets')
    this._buckets[hashed.hash % this._buckets.length].locate(hashed, value)
}

Router.prototype.push = function (envelope) {
    if (this._buckets.length == 0) {
        logger.notice('dropped', { route: [ this._client.hostname ] , gatherer: envelope.gatherer })
    } else {
        this._buckets[envelope.hashed.hash % this._buckets.length].push(envelope)
    }
}

Router.prototype.setBuckets = function (buckets) {
    var updated = []
    for (var i = 0, I = buckets.length; i < I; i++) {
        if (this._idenifier == buckets[i]) {
            if (this._buckets[i] == null) {
                updated[i] = new WaitingBucket(this._client, updated, i)
            } else {
                updated[i] = this._buckets[i]
            }
        } else {
            updated[i] = new RouteBucket(this._client, this._idenifier)
            if (this._buckets[i] != null) {
                this._buckets[i].drop(updated[i])
            }
        }
    }
    this._buckets = updated
}

Router.prototype.ready = function () {
    this._buckets.forEach(function (bucket) { bucket.ready() })
}

module.exports = Router
