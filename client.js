var cadence = require('cadence')
var Monotonic = require('monotonic').toString
var Procession = require('procession')

function Client (destructible, Connection) {
    this._Connection = Connection
    this._promise = '0/0'
    this._destructible = destructible
    this._connections = {}
}

Client.prototype.setRoutes = function (routes) {
    this._locations = {}
    for (var promise in routes.properties) {
        this._locations[promise] = routes.properties[promise].location
    }
    this._hangup(Object.keys(this._locations))
}

Client.prototype._hangup = function (arrivals) {
    Object.keys(this._connections).filter(function (promise) {
        return !~arrivals.indexOf(promise)
    }).forEach(function (promise) {
        this._connections[promise].push(null)
        delete this._connections[promise]
    }, this)
}

Client.prototype.push = function (envelope) {
    var procession = this._connections[envelope.to]
    if (procession == null) {
        procession = this._connections[envelope.to] = new Procession
        this._Connection.call(null, this._locations[envelope.to], procession.shifter())
    }
    procession.push(envelope)
}

module.exports = cadence(function (async, destructible, Connection) {
    return new Client(destructible, Connection)
})
