var logger = require('prolific.logger').createLogger('diffuser')
var Interrupt = require('interrupt').createInterrupter('diffuser')
var coalesce = require('extant')
var Procession = require('procession')

function noop () {}

function locate (stringified, address) {
    this._locations[stringified] = address
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
        // TODO Let client hash using its own table.
        to: this._address,
        hashed: envelope.hashed,
        type: 'request',
        body: envelope.body
    })
}

RouteBucket.prototype.ready = noop

RouteBucket.prototype.drop = noop

function WaitingBucket (actor, client, buckets, index) {
    this._actor = actor
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
    var bucket = this._buckets[this._index] = new ActiveBucket(this._actor, this._client, this._locations)
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

function ActiveBucket (actor, client, locations) {
    this._actor = actor
    this._client = client
    this._locations = locations
}

ActiveBucket.prototype.locate = locate

ActiveBucket.prototype.push = function (envelope) {
    switch (envelope.destination) {
    case 'router':
        this._actor.act(envelope)
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

function Router (actor, client, identifier) {
    this._actor = actor
    this._client = client
    this._idenifier = identifier
    this._buckets = []
}

Router.prototype.locate = function (hashed, value) {
    Interrupt.assert(this._buckets.length != 0, 'no.buckets')
    this._buckets[hashed.hash % this._buckets.length].locate(hashed.stringified, value)
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
            updated[i] = new WaitingBucket(this._actor, this._client, updated, i)
        } else {
            updated[i] = new RouteBucket(this._client, this._idenifier)
        }
        if (this._buckets[i] != null) {
            this._buckets[i].drop(updated[i])
        }
    }
    this._buckets = updated
}

Router.prototype.ready = function () {
    this._buckets.forEach(function (bucket) { bucket.ready() })
}

module.exports = Router
