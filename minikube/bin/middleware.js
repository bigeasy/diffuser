var cadence = require('cadence')

var Reactor = require('reactor')

var Keyify = require('keyify')

function Middleware (diffuser, identifier) {
    this._identifier = identifier
    this._diffuser = diffuser
    this.middleware = Reactor.reactor(this, function (configurator) {
        configurator.dispatch('POST /route', 'route')
        configurator.logger = function (entry) {
            if (entry.error) {
                console.log(entry.error.stack)
            }
        }
    })
}

Middleware.prototype.route = cadence(function (async, request) {
    var json = request.body
    async(function () {
        this._diffuser.route2('receiver', {
            key: Keyify.stringify(json.from),
            body: {
                method: 'route',
                from: this._identifier,
                cookie: json.cookie
            }
        }, {
            method: 'route',
            from: this._identifier,
            to: json.from
        }, async())
    }, function (successful, responses) {
        if (!successful) {
            console.log('routing failed', responses)
        }
        return successful
    })
})

module.exports = Middleware
