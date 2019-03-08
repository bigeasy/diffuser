var Queue = require('procession')

var RBTree = require('bintrees').RBTree

var Interrupt = require('interrupt').createInterrupter('diffuser')

function Table (redundancy, multipler) {
    this.events = new Queue
    this.table = null
    this.redundancy = redundancy
    this.multipler = multipler
    this.version = '0'
    this.arriving = []
}

var RBTree = require('bintrees').RBTree
var Monotonic = require('monotonic').asString

Table.prototype.bootstrap = function () {
    this.table = {
        version: '0',
        redundancy: 0,
        addresses: [],
        buckets: []
    }
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

// NOTE Going to further hash the results by the instance worker processes, but
// not add additional buckets. The buckets will determine which instance. The
// messages will then be sharded again among the workers. Our table is an
// instance lookup table.

// We can implement our balancing logic assuming that there the instance with the
// maximum number of buckets will have zero buckets.

// We always want to have more buckets than there are instances. Furthermore, we
// want to ensure that there are more buckets than there are total workers, that
// is instances by workers per instance. For now we're going to do instances *
// workers * 2 to get our desired buckets.
//
// Our table length is a power of 2 so that we can index it using `hash &
// (length - 1)` and we can double it by appending a copy of the table to
// itself. When doing so `hash & (length - 1)` will return the same value for
// the newly doubled table. The new mask will include an additional most
// significant bit. All that bit it going to do is determine whether to look in
// the first half or the second half of the table, then the remaining bits
// determine the index within the half. Since the second half is a duplicate of
// the first half, the value returned is the same.

//

Table.prototype.arrive = function (self, promise) {
    this.arriving.push(promise)
    if (this.table.pending == null) {
        this._rebalance(self)
    }
}

Table.prototype._rebalance = function (self) {
    var addresses = this.table.addresses.concat(this.arriving.shift())
    var version = this.version = Monotonic.increment(this.version, 0)
    if (addresses.length == 1) {
        Interrupt.assert(addresses[0] == self, 'bad.bootstrap.promise')
        this.events.push({
            module: 'diffuser',
            method: 'bootstrap',
            table: this.table = {
                version: version,
                redundancy: 1,
                addresses: addresses,
                buckets: [ addresses[0] ],
                departed: []
            }
        })
    } else {
        var redundancy = Math.min(addresses.length, this.redundancy)
        // Ensure we have plenty of buckets. See discussion of doubling above.
        var buckets = this.table.buckets.slice()
        var minimum = addresses.length * this.multipler
        while (buckets.length < minimum) {
            buckets.push.apply(buckets, buckets)
        }
        this._balance(buckets, addresses)
        this.table = {
            version: this.table.version,
            buckets: this.table.buckets,
            addresses: this.table.addresses,
            redundancy: this.table.redundancy,
            departed: this.table.departed,
            pending: {
                version: version,
                redundancy: redundancy,
                buckets: buckets,
                addresses: addresses,
                departed: []
            }
        }
        this.events.push(JSON.parse(JSON.stringify({
            module: 'diffuser',
            method: 'receive',
            version: this.table.pending.version
        })))
    }
}

Table.prototype.received = function (version) {
    Interrupt.assert(version == this.table.pending.version, 'complete.wrong.version')
    // You can now see the structure of a pending message.
    this.events.push(JSON.parse(JSON.stringify({
        module: 'diffuser',
        method: 'balance',
        table: this.table
    })))
}

Table.prototype.complete = function (version) {
    Interrupt.assert(version == this.table.pending.version, 'complete.wrong.version')
    if (this.table.departed.length == 0) {
        this.events.push(JSON.parse(JSON.stringify({
            module: 'diffuser',
            method: 'complete',
            table: this.table = this.table.pending
        })))
    }
}

module.exports = Table
