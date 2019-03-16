var Monotonic = require('monotonic').asString

function Addresser () {
    this._promises = {}
}

Addresser.prototype.promises = function () {
    return Object.keys(this._promises)
}

Addresser.prototype.list = function (promise) {
    if (!(promise in this._promises)) {
        return []
    }
    var list = []
    for (var index in this._promises[promise]) {
        list.push(this._promises[promise][index])
    }
    return list.sort(function (left, right) { return left.index - right.index })
}

Addresser.prototype.remove = function (to) {
    if (to.promise in this._promises) {
        delete this._promises[to.promise][to.index]
        if (Object.keys(this._promises[to.promise]).length == 0) {
            delete this._promises[to.promise]
        }
    }
}

Addresser.prototype.put = function (to, value) {
    var connections = this._promises[to.promise]
    if (connections == null) {
        connections = this._promises[to.promise] = {}
    }
    var previous = connections[to.index]
    connections[to.index] = value
    return previous
}

Addresser.prototype.get = function (to) {
    var connections = this._promises[to.promise]
    if (connections == null) {
        return null
    }
    var connection = connections[to.index]
    if (connection == null) {
        return null
    }
    return connection
}

module.exports = Addresser
