var Queue = require('procession')

var RBTree = require('bintrees').RBTree

var Interrupt = require('interrupt').createInterrupter('diffuser')

// TODO First by count, then by address descending so that we can end when the
// promises no longer match, that is we've equaled.
function comparator (left, right) {
    return left.count - right.count
}

// Can't think of a good word for the slop I'm trying to add with minimum
// buckets per. If we had just one bucket per instance, then a failure of one
// instance ah..

function Table (redudancy) {
    this.events = new Queue
    this._counts = {
        primary: new RBTree(comparator),
        secondary: new RBTree(comparator)
    }
    this._redudancy = redudancy
}

Table.prototype.bootstrap = function (self, count) {
    this.self = self
    this.properties = {}
    this.addresses = []
    this.buckets = []
}

Table.prototype._double = function (counter) {
    var doubled = new RBTree(comparator)
    while (counter.size != 0) {
        var item = counter.remove(counter.min())
        item.count *= 2
        doubled.insert(item)
    }
    return doubled
}

Table.prototype.redistribute = function () {
    var counts = new RBTree(function (left, right) { return left.length - right.length })
    var next = JSON.parse(JSON.stringify(this.replicas))
    next[next.length - 1] = []
    next.replicas.push([])
    next.forEach(function (replica) { counts.insert(replica) })
    this.replicas[this.replicas.length - 1].forEach(function (bucket) {
        var min = counts.remove(counts.mix())
    })
}

Table.prototype.arrive = function (promise) {
    this.addresses.push(promise)
    if (this.addresses.length == 0) {
        Interrupt.assert(promise == this.self, 'bad.bootstrap.promise')
        this.buckets.push(promise)
        this._counts.primary.insert({ count: 1, address: promise })
        this._counts.secondary.insert({ count: 0, address: promise })
        this.events.push(JSON.parse(JSON.stringify({
            module: 'diffuser',
            method: 'balance',
            addresses: this.addresses,
            buckets: this.buckets
        })))
    } else {
        // If we have an addition outstanding, then we're going to just push
        // this arrival into a waiting queue.
        var redundancy = Math.min(this._redudancy, this.addresses.length)
        var buckets = this.addresses.length * this.addresses.length
        while (this.buckets.length < buckets) {
            // TODO Jeesh, you mean we need to have replicas
            this.buckets.push.apply(this.buckets, JSON.parse(JSON.stringify(this.buckets)))
            this._counters.primary = this._double(this._counters.primary)
            this._counters.secondary = this._double(this._counters.secondary)
        }
        // Something, something sort by primary and secondary and bucket number.
        this._counters.primary.insert({ count: 0, promise: promise })
        while (this._counters.primary.min().promise == promise) {
            var max = this._counters.primary.remove(this._counters.primary.max())
            var min = this._counters.primary.remove(this._counters.primary.min())
            this.buckets[this.buckets.indexOf(max.promise)] = min.promise
            min.count++
            max.count--
            this._counters.primary.insert(min)
            this._counters.primary.insert(max)
        }
        var replicas = redundancy - 1
    }
}

Table.prototype.depart = function (promise) {
    // Note that when we get down to two we want a single primary server and a
    // single secondary server so we have a 50/50 chance of surviving the next
    // crash.
}

module.exports = Table
