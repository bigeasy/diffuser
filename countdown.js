var Monotonic = require('monotonic').asString
var RBTree = require('bintrees').RBTree

function Countdown () {
    this._countdowns = {}
}

Countdown.prototype.start = function (routes) {
    var countdown = new RBTree(function (left, right) {
        var compare = Monotonic.compare(left.promise, right.promise)
        if (compare == 0) {
            return left.index - right.index
        }
        return compare
    })
    for (var promise in routes.properties) {
        var count = routes.properties[promise].count
        for (var i = 0; i < count; i++) {
            countdown.insert({ promise: promise, index: i })
        }
    }
    this._countdowns[routes.promise] = countdown
}

Countdown.prototype._checkEmpty = function (promise) {
    if (this._countdowns[promise].size == 0) {
        delete this._countdowns[promise]
    }
}

Countdown.prototype.arrive = function (promise, from) {
    var countdown = this._countdowns[promise]
    if (countdown == null) {
        return
    }
    countdown.remove(from)
    this._checkEmpty(promise)
}

Countdown.prototype.depart = function (promise, departure) {
    var address, found = []
    var countdown = this._countdowns[promise]
    if (countdown == null) {
        return
    }
    var iterator = countdown.lowerBound({ promise: departure, index: 0 })
    while ((address = iterator.data()) != null && address.promise == departure) {
        found.push(address)
        iterator.next()
    }
    while ((address = found.shift()) != null) {
        countdown.remove(address)
    }
    this._checkEmpty(promise)
}

Countdown.prototype.remaining = function (promise) {
    return this._countdowns[promise] ? this._countdowns[promise].size : null
}

module.exports = Countdown
