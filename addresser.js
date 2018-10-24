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
    return this._promises[promise].filter(function (connection) {
        return connection != null
    })
}

Addresser.prototype.remove = function (to) {
    if (to.promise in this._promises) {
        this._promises[to.promise][to.index] = null
        if (this._promises[to.promise].filter(function (connection) {
            return connection != null
        }).length == 0) {
            delete this._promises[to.promise]
        }
    }
}

Addresser.prototype.put = function (to, value) {
    var connections = this._promises[to.promise]
    if (connections == null) {
        connections = this._promises[to.promise] = []
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
