var cadence = require('cadence')
var Monotonic = require('monotonic').toString
var Procession = require('procession')

function Client (connector) {
    this._connector = connector
}

Client.prototype.push = function (envelope) {
    this._connector.connect(envelope.to).push(envelope)
}

module.exports = Client
