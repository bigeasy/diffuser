var Interrupt = require('interrupt').createInterrupter('diffuser')
var coalesce = require('extant')

function noop () {}

function set (hashed, value) {
    this._values[hashed.stringified] = value
}

function EmptyBucket() {
}

EmptyBucket.prototype.set = noop

EmptyBucket.prototype.get = function (hashed, callback) {
    callback(null, null)
}

EmptyBucket.prototype.ready = noop

EmptyBucket.prototype.drop = noop

function WaitingBucket (buckets, index) {
    this._buckets = buckets
    this._index = index
    this._waiting = []
    this._values = {}
}

WaitingBucket.prototype.set = set

WaitingBucket.prototype.get = function (hashed, callback) {
    this._waiting.push({ hashed: hashed, callback: callback })
}

WaitingBucket.prototype.ready = function () {
    var bucket = this._buckets[this._index] = new ActiveBucket(this._values)
    this._waiting.forEach(function (wait) {
        bucket.get(wait.hashed, wait.callback)
    }, this)
}

WaitingBucket.prototype.drop = function () {
    this._waiting.forEach(function (wait) { (wait.callback)(new Interrupt('unrouted', {})) })
}

function ActiveBucket (values) {
    this._values = values
}

ActiveBucket.prototype.set = set

ActiveBucket.prototype.get = function (hashed, callback) {
    callback(null, coalesce(this._values[hashed.stringified]))
}

ActiveBucket.prototype.ready = noop

ActiveBucket.prototype.drop = noop

function Database (identifier) {
    this._idenifier = identifier
    this._buckets = []
}

Database.prototype.set = function (hashed, value) {
    Interrupt.assert(this._buckets.length != 0, 'no.buckets')
    this._buckets[hashed.hash % this._buckets.length].set(hashed, value)
}

Database.prototype.get = function (hashed, callback) {
    if (this._buckets.length == 0) {
        callback(null, null)
    } else {
        this._buckets[hashed.hash % this._buckets.length].get(hashed, callback)
    }
}

Database.prototype.setBuckets = function (buckets) {
    var updated = []
    for (var i = 0, I = buckets.length; i < I; i++) {
        if (this._idenifier == buckets[i]) {
            if (this._buckets[i] == null) {
                updated[i] = new WaitingBucket(updated, i)
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
