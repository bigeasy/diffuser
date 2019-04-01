// Node.js API.
var assert = require('assert')

// Control-flow utilities.
var cadence = require('cadence')

// Evented map.
var Cubbyhole = require('cubbyhole')

// An evented message queue.
var Procession = require('procession')

// Our deterministic routing table builder.
var Table = require('./table')

var Signal = require('signal')

var asssert = require('assert')

// Count is the number of buckets to divide among instances.
function Consensus (count) {
    this.routes = new Procession
    this._cubbyholes = new Cubbyhole
    this._table = new Table
    this._count = count
    this.arrived = new Signal
}

// Provide the current state of the routing tables for a new participant joining
// the consensus.
Consensus.prototype.snapshot = cadence(function (async, promise, outbox) {
    async(function () {
        console.log('GET SNAPSHOT', promise)
        this._cubbyholes.wait(promise, async())
    }, function (stored) {
        console.log('GOT SNAPSHOT', stored)
        outbox.push(stored)
        outbox.end()
    })
})

// Dispatch a consensus message.
Consensus.prototype.dispatch = cadence(function (async, envelope) {
    switch (envelope.method) {
    case 'bootstrap':
        // Make a routing table that includes just us.
        this._table.bootstrap(envelope.self.arrived, this._count)
        break
    case 'join':
        // Copy the existing routing table from a peer when we join an existing
        // consensus. Will be followed by an arrive message we'll use to add
        // ourselves to the table.
        async(function () {
            envelope.snapshot.dequeue(async())
        }, function (body) {
            console.log('APPLY SNAPSHOT', body)
            assert(body != null)
            this._table.join(envelope.self.arrived, body)
            envelope.snapshot.dequeue(async())
        }, function (value) {
            assert(value == null, 'eos expected')
        })
        break
    case 'arrive':
        // The first arrival will be us and `unlatch` is final.
        this.arrived.unlatch()
        // Add a newly arrived participant to the routing table. Get a snapshot
        // of the existing table before we add the arrival in case the arrival
        // asks us for the existing state.
        this._cubbyholes.set(envelope.government.promise, null, this._table.getSnapshot())
        this._table.arrive(envelope.government.promise, envelope.entry.arrive.properties)
        console.log('>>>', envelope)
        this.routes.push(this._table.getSnapshot({
            action: 'arrive',
            promise: envelope.government.promise,
            republic: envelope.government.republic,
            isLeader: envelope.self.arrived == envelope.government.arrived.promise[envelope.government.majority[0]]
        }))
        break
    case 'acclimated':
        // Discard our existing state snapshot once an arrival has acclimated.
        console.log('BLAST SNAPSHOT', envelope.government.promise)
        this._cubbyholes.remove(envelope.government.promise)
        break
    case 'depart':
        // Remove a participant from the routing table and discard the exisiting
        // state snapshot if any.
        console.log(envelope)
        this._cubbyholes.remove(envelope.body.departed.promise)
        this._table.depart(envelope.body.departed.promise, envelope.government.promise)
        this.routes.push(this._table.getSnapshot({
            action: 'depart',
            promise: envelope.body.departed.promise,
            republic: envelope.government.republic,
            isLeader: envelope.self.arrived == envelope.government.arrived.promise[envelope.government.majority[0]]
        }))
        break
    }
})

module.exports = Consensus
