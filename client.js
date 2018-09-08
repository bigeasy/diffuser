var cadence = require('cadence')
var Monotonic = require('monotonic').toString

function Client (destructible, Connection) {
    this._Connection = Connection
    this._promise = '0/0'
    this._destructible = destructible
    this._connections = {}
}

Client.prototype.hangup = function (arrivals) {
    Object.keys(this._connections).filter(function (promise) {
        return !~arrivals.indexOf(promise)
    }).forEach(function (promise) {
        this._connections[arrivals].queue.push(null)
        delete this._connections[arrivals]
    }, this)
}

Client.prototype.setLocations = function (locations) {
    this._locations = locations
}

Client.prototype.push = function (envelope) {
    var connection = this._connections[envelope.to]
    if (connection == null) {
        connection = this._connections[envelope.to] = new this._Connection(this._locations[envelope.to])
    }
    connection.queue.push(envelope)
}

module.exports = cadence(function (async, destructible, Connection) {
    return new Client(destructible, Connection)
})
