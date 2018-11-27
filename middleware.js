var cadence = require('cadence')
var Reactor = require('reactor')

function Middleware () {
    this.reactor = new Reactor(this, function (dispatcher) {
        dispatcher.dispatch('GET /', 'index')
    })
}

Middleware.prototype.index = cadence(function (async) {
    return [ 200, { 'content-type': 'text/plain' }, 'Diffuser Socket API\n' ]
})

module.exports = Middleware
