var Queue = require('procession')

var RBTree = require('bintrees').RBTree

var Interrupt = require('interrupt').createInterrupter('diffuser')

function Table (redundancy, workers) {
    this.events = new Queue
    this.addresses = []
    this.buckets = []
    this.redundancy = redundancy
    this.workers = workers
    this.balanced = []
    this.version = '0'
}

var RBTree = require('bintrees').RBTree
var Monotonic = require('monotonic').asString

Table.prototype.bootstrap = function () {
}

Table.prototype._balance = function balance (buckets, addresses) {
    var counters = {}
    addresses.forEach(function (address) {
        counters[address] = 0
    })

    buckets.forEach(function (promise) {
        counters[promise]++
    })

    var loaded = new RBTree(function (left, right) {
        var compare = left.count - right.count
        if (compare != 0) {
            return compare
        }
        return Monotonic.compare(left.promise, right.promise)
    })

    for (var promise in counters) {
        loaded.insert({ promise: promise, count: counters[promise] })
    }

    var balance = buckets.length % addresses.length == 0 ? 0 : 1

    var min, max
    while (Math.abs(loaded.min().count - loaded.max().count) > balance) {
        max = loaded.max()
        min = loaded.min()
        loaded.remove(min)
        loaded.remove(max)
        buckets[buckets.indexOf(max.promise)] = min.promise
        max.count--
        min.count++
        loaded.insert(max)
        loaded.insert(min)
    }
}

// We can implement our balancing logic assuming that there the instance with the
// maximum number of buckets will have zero buckets.

// We always want to have more buckets than there are intances. Furthermore, we
// want to ensure that there are more buckets than there are total workers, that
// is instances by workers per instance. For now we're going to do instances *
// workers * 2 to get our desired buckets.
//
// Our table length is a power of 2 so that we can index it using `hash &
// (length - 1)` and we can double it by appending a copy of the table to
// itself. When doing so `hash & (length - 1)` will return the same value for
// the newly doubled table. The new mask will include an additional most
// significant bit. All that bit it going to do is determine whehter to look in
// the first half or the second half of the table, then the remaining bits
// determine the index within the half. Since the second half is a duplicate of
// the first half, the value returned is the same.

//

Table.prototype.arrive = function (self, promise) {
    this.addresses.push(promise)
    var version = this.version = Monotonic.increment(this.version, 0)
    if (this.addresses.length == 1) {
        Interrupt.assert(promise == self, 'bad.bootstrap.promise')
        this.buckets.push(promise)
        this.events.push(JSON.parse(JSON.stringify({
            module: 'diffuser',
            method: 'bootstrap',
            promise: promise,
            version: version,
            redundancy: 1,
            addresses: this.addresses,
            buckets: this.buckets
        })))
    } else {
        var redundancy = Math.min(this.addresses.length, this.redundancy)
        // Ensure we have plenty of buckets. See discussion of doubling above.
        var buckets = this.buckets.slice()
        var minimum = this.addresses.length * this.workers * 2
        while (buckets.length < minimum) {
            buckets.push.apply(buckets, buckets)
        }
        // TODO Not sure what we need to keep in order to fallback.
        this._balance(buckets, this.addresses)
        this.balanced.push({
            promise: promise,
            buckets: buckets
        })
        this.events.push(JSON.parse(JSON.stringify({
            module: 'diffuser',
            method: 'balance',
            promise: promise,
            version: version,
            redundancy: redundancy,
            buckets: this.buckets,
            balanced: buckets,
            addresses: this.addresses
        })))
    }
}

Table.prototype.complete = function (promise, responses) {
    if (this.balanced[0].promise == promise) {
        this.buckets = this.balanced.pop().buckets
        if (this.arriving.length != 0) {
        }
    }
}

module.exports = Table
