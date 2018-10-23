function Connections () {
    this._connections = {}
}

Connections.prototype.promises = function () {
    return Object.keys(this._connections)
}

Connections.prototype.list = function (promise) {
    if (!(promise in this._connections)) {
        return []
    }
    return this._connections[promise].filter(function (connection) {
        return connection != null
    })
}

Connections.prototype.remove = function (to) {
    if (to.promise in this._connections) {
        this._connections[to.promise][to.index] = null
        if (this._connections[to.promise].filter(function (connection) {
            return connection != null
        }).length == 0) {
            delete this._connections[to.promise]
        }
    }
}

Connections.prototype.put = function (to, value) {
    var connections = this._connections[to.promise]
    if (connections == null) {
        connections = this._connections[to.promise] = []
    }
    var previous = connections[to.index]
    connections[to.index] = value
    return previous
}

Connections.prototype.get = function (to) {
    var connections = this._connections[to.promise]
    if (connections == null) {
        return null
    }
    var connection = connections[to.index]
    if (connection == null) {
        return null
    }
    return connection
}

module.exports = Connections
