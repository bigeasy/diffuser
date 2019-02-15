var Queue = require('procession')

var RBTree = require('bintrees').RBTree

var Interrupt = require('interrupt').createInterrupter('diffuser')

function comparator (left, right) { return left.count - right.count }

function Table (replicas) {
    this.events = new Queue
    this._counts = {
        primary: new RBTree(comparator),
        secondary: new RBTree(comparator)
    }
    this._replicas = replicas
}

Table.prototype.bootstrap = function (self, count) {
    this.self = self
    this.properties = {}
    this.addresses = []
    this.buckets = []
}

Table.prototype.arrive = function (promise) {
    if (this.buckets.length == 0) {
        Interrupt.assert(promise == this.self, 'bad.bootstrap.promise')
        this.buckets.push(promise)
        this.addresses.push(promise)
        this._counts.primary.insert({ count: 1, address: promise })
        this.events.push(JSON.parse(JSON.stringify({
            module: 'diffuser',
            method: 'balance',
            addresses: this.addresses,
            buckets: this.buckets
        })))
    } else if (this.buckets.length < this._replicas + 1) {
    }
}

module.exports = Table
