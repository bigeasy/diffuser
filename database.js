var logger = require('prolific.logger').createLogger('diffuser')
var Interrupt = require('interrupt').createInterrupter('diffuser')
var coalesce = require('extant')
var Procession = require('procession')

function noop () {}

function locate (hashed, address) {
    this._locations[hashed.stringified] = address
}

function EmptyBucket() {
}

EmptyBucket.prototype.locate = noop

EmptyBucket.prototype.push = noop

EmptyBucket.prototype.ready = noop

EmptyBucket.prototype.drop = noop

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

WaitingBucket.prototype.drop = function () {
    var envelope = null
    while ((envelope = this._shifter.shift()) != null) {
        logger.notice('dropped', { gatherer: envelope.gatherer })
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

function Database (client, identifier) {
    this._client = client
    this._idenifier = identifier
    this._buckets = []
}

Database.prototype.locate = function (hashed, value) {
    Interrupt.assert(this._buckets.length != 0, 'no.buckets')
    this._buckets[hashed.hash % this._buckets.length].locate(hashed, value)
}

Database.prototype.push = function (envelope) {
    if (this._buckets.length == 0) {
        logger.notice('dropped', { route: [ this._client.hostname ] , gatherer: envelope.gatherer })
    } else {
        this._buckets[envelope.hashed.hash % this._buckets.length].push(envelope)
    }
}

Database.prototype.setBuckets = function (buckets) {
    var updated = []
    for (var i = 0, I = buckets.length; i < I; i++) {
        if (this._idenifier == buckets[i]) {
            if (this._buckets[i] == null) {
                updated[i] = new WaitingBucket(this._client, updated, i)
            } else {
                updated[i] = this._buckets[i]
            }
        } else {
            if (this._buckets[i] != null) {
                this._buckets[i].drop()
            }
            updated[i] = new EmptyBucket
        }
    }
    this._buckets = updated
}

Database.prototype.ready = function () {
    this._buckets.forEach(function (bucket) { bucket.ready() })
}

module.exports = Database
