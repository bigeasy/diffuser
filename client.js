var Procession = require('procession')

function Client (connector) {
    this._connector = connector
}

Client.prototype.setRoutes = function (routes) {
    this._routes = routes
}

Client.prototype.push = function (envelope) {
    if (this._routes.properties[envelope.to.promise] != null) {
        this._connector.connect(envelope.to).push(envelope)
    }
}

module.exports = Client
