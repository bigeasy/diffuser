var Procession = require('procession')
var Signal = require('signal')

function Connections (constructor) {
    this._connections = {}
    this._constructor = constructor
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

Connections.prototype.get = function (to) {
    var connections = this._connections[to.promise]
    if (connections == null) {
        connections = this._connections[to.promise] = []
    }
    var connection = connections[to.index]
    if (connection == null) {
        connection = connections[to.index] = this._constructor.call(null, to)
    }
    return connection
}

module.exports = Connections
