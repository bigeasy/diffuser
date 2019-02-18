var Queue = require('procession')

var RBTree = require('bintrees').RBTree

var Interrupt = require('interrupt').createInterrupter('diffuser')

function comparator (left, right) { return left.count - right.count }

function Table (redundancy) {
    this.events = new Queue
    this._redundancy = redundancy
}

Table.prototype.bootstrap = function () {
    this.addresses = []
    this.buckets = []
}

Table.prototype.arrive = function (self, promise) {
    this.addresses.push(promise)
    if (this.addresses.length == 1) {
        Interrupt.assert(promise == self, 'bad.bootstrap.promise')
        this.buckets.push(promise)
        this.events.push(JSON.parse(JSON.stringify({
            module: 'diffuser',
            method: 'balance',
            addresses: this.addresses,
            buckets: this.buckets
        })))
    } else if (this.buckets.length < this._redundancy) {
    }
}

module.exports = Table
