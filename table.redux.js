const { Queue } = require('avenue')

const assert = require('assert')

const RBTree = require('bintrees').RBTree
const Monotonic = require('paxos/monotonic')

const Vivifyer = require('vivifyer')

// TODO We can have an arrivals queue. Not difficult. Arrival does not return a
// new version. A separate function determines if there is a next version.

class Table {
    constructor (multipler) {
        this.events = new Queue
        this.table = null
        this._initialized = false
        this.arrivals = []
        this.multipler = multipler
        this.departures = 0
        this.versions = new RBTree((left, right) => Monotonic.compare(left.version, right.version))
        this.versions.insert({ version: '0/0', pending: true })
    }

    get active () {
        return this.departures == 0 && this._initialized
    }

    get version () {
        return this._initialized ? this.versions.min().version : '0/0'
    }

    get tables () {
        const tables = []
        this.versions.each(version => {
            const where = {}
            for (const [ key, value ] of version.where) {
                where[key] = [ ...value ]
            }
            tables.push({
                version: version.version,
                previous: version.previous,
                type: version.type,
                where: where,
                addresses: version.addresses.slice(),
                buckets: version.buckets.slice(),
                departed: version.departed.slice()
            })
        })
        return tables
    }

    has (version, promise, hashed) {
        const table = this.versions.get(version).table
        return table.buckets[hashed & (table.buckets.length - 1)] == promise
    }

    set (hashed, id, connectedTo) {
        this.versions.each(({ buckets, where }) => {
            if (buckets[hashed & (buckets.length - 1)] == this.promise) {
                let set = where.get(id)
                if (set == null) {
                    set = new Set
                    where.set(id, set)
                }
                set.add(connectedTo)
            }
        })
    }

    lookup (hashed) {
        const { buckets } = this.versions.min()
        return buckets[hashed & (buckets.length - 1)]
    }

    where (version, id) {
        const { where } = this.versions.find({ version })
        return [ ...(where.get(id) || []) ]
    }

    _balance (buckets, addresses) {
        const counters = {}
        addresses.forEach(function (address) {
            counters[address] = 0
        })

        buckets.forEach(function (promise) {
            counters[promise]++
        })

        const loaded = new RBTree(function (left, right) {
            const compare = left.count - right.count
            if (compare != 0) {
                return compare
            }
            return Monotonic.compare(left.promise, right.promise)
        })

        for (const promise in counters) {
            loaded.insert({ promise: promise, count: counters[promise] })
        }

        const balance = buckets.length % addresses.length == 0 ? 0 : 1

        let min, max
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

    snapshot (version) {
        const { previous } = this.versions.find({ version })
        const { type, buckets, addresses } = this.versions.find({ version: previous })
        return { version: previous, type, buckets, addresses }
    }

    join ({ version, type, buckets, addresses }) {
        this.versions.insert({
            version: version,
            previous: '0/0',
            type: type,
            where: new Map(),
            addresses: addresses,
            buckets: buckets,
            departed: []
        })
        this.versions.remove(this.versions.min())
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

    arrive (self, promise) {
        this.promise = self
        return this._rebalance(self, promise)
    }

    _rebalance (self, promise) {
        const previous = this.versions.min().version
        if (promise == '1/0') {
            const addresses = [ promise ]
            assert(addresses[0] == self)
            this.versions.insert({
                version: promise,
                previous: previous,
                type: 'arrival',
                where: new Map(),
                addresses: addresses,
                buckets: [ addresses[0] ],
                departed: []
            })
            return promise
        }
        const max = this.versions.max()
        const addresses = max.addresses.concat(promise)
        // Ensure we have plenty of buckets. See discussion of doubling above.
        const buckets = max.buckets.slice()
        const minimum = addresses.length * this.multipler
        while (buckets.length < minimum) {
            buckets.push.apply(buckets, buckets)
        }
        this._balance(buckets, addresses)
        this.versions.insert({
            version: promise,
            previous: previous,
            type: 'arrival',
            where: new Map(),
            addresses: addresses,
            buckets: buckets,
            departed: []
        })
        return promise
    }

    received (version) {
        assert(version == this.table.pending.version, 'complete.wrong.version')
        // You can now see the structure of a pending message.
        this.events.push(JSON.parse(JSON.stringify({
            module: 'diffuser',
            method: 'balance',
            table: this.table
        })))
    }

    complete (version) {
        for (;;) {
            const min = this.versions.min()
            if (Monotonic.compare(min.version, version) >= 0) {
                break
            }
            this.versions.remove(min)
            if (min.type == 'departure') {
                this.departures--
            }
        }
        this._initialized = true
    }

    // TODO How would we leave nicely? We would take a `SIGTERM` and use it to
    // tell our connector to hangup everything and shutdown. We would then run a
    // leave round where we would create a new table that excludes us from
    // lookup but run it through an arrival migration. Then when we depart we
    // wouldn't do the harsh depart if none of tables contained our address.

    // TODO If we are processing a new version the last version in the list of
    // verisons is the departing version, we could no-op somehow. When it comes
    // time to complete we could not simply not remove the previous version if
    // there is no next version.

    depart (version, departure) {
        // Otherwise we are going to stop processing requests.
        this.departures++
        const max = this.versions.max()
        const addresses = max.addresses.filter(address => address != departure)
        const buckets = max.buckets.map(address => address == departure ? addresses[0] : address)
        this._balance(buckets, addresses)
        this.versions.insert({
            version: version,
            previous: max.version,
            type: 'departure',
            where: new Map(),
            addresses: addresses,
            buckets: buckets,
            departed: []
        })
        return version
    }
}

module.exports = Table
