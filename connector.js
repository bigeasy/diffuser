var cadence = require('cadence')
var Procession = require('procession')

var http = require('http')
var url = require('url')

var delta = require('delta')

var Downgrader = require('downgrader')

var logger = require('prolific.logger').createLogger('diffuser')

var Sender = require('./sender')

var Destructible = require('destructible')

var Conduit = require('conduit')

function Connector (destructible) {
    this.feedback = new Procession
    this._connections = {}
    this._destructible = destructible
}

Connector.prototype.setLocations = function (locations) {
    for (var key in this._connections) {
        var connection = this._connections[key]
        if (!(connection.hash.key.promise in locations)) {
            connection.outbox.push(null)
        }
    }
    this._locations = locations
}

Connector.prototype.connect = function (hash) {
    var connection = this._connections[hash.stringified]
    if (connection == null) {
        connection = this._connections[hash.stringified] = {
            hash: hash,
            outbox: new Procession,
            destructible: null
        }
        var shifter = connection.outbox.shifter()
        this._connect(hash, connection.outbox.shifter(), this._destructible.monitor([ 'connector', hash.key ], true))
    }
    return connection.outbox
}

Connector.prototype._connect = cadence(function (async, hash, shifter) {
    async(function () {
        async([function () {
            async(function () {
                console.log(this._locations, hash)
                var location = url.parse(this._locations[hash.key.promise])
                var request = http.request({
                    host: location.hostname,
                    port: +location.port,
                    headers: Downgrader.headers({
                        'x-diffuser-to-promise': hash.key.promise,
                        'x-diffuser-to-index': hash.key.index
                    })
                })
                delta(async()).ee(request).on('upgrade')
                request.end()
            }, function (request, socket, head) {
                async(function () {
                    var destructible = new Destructible([ 'connection' ])
                    var sender = new Sender(destructible, this.feedback)
                    async(function () {
                        destructible.monitor('conduit', Conduit, sender, socket, socket, head, async())
                    }, function () {
                        shifter.pump(sender.outbox)
                        destructible.completed.wait(async())
                    })
                })
            })
        }, function (error) {
            console.log(error.stack)
            logger.error('error', { stack: error.stack })
        }])
    }, function () {
        delete this._connections[hash.stringified]
    })
})

module.exports = cadence(function (async, destructible) {
    return new Connector(destructible)
})
