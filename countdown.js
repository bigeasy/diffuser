var Monotonic = require('monotonic').asString
var RBTree = require('bintrees').RBTree

function Countdown () {
    this._countdowns = {}
    this._countdown = { size: 0 }
    this.promise = '0/0'
    this.count = 0
}

Countdown.prototype.start = function (routes) {
    this.promise = routes.promise
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
    this._countdown = countdown
    this.count = this._countdown.size
}

Countdown.prototype.arrive = function (promise, from) {
    if (promise == this.promise) {
        this._countdown.remove(from)
        this.count = this._countdown.size
    }
}

module.exports = Countdown
