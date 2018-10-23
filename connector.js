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

var Window = require('conduit/window')

var Demur = require('demur')

var Signal = require('signal')

var Connections = require('./connections')

var Router = require('./lookup')

function Connector (destructible, index) {
    this.feedback = new Procession
    var self = this
    this._connections = new Connections(function (to) {
        var connection = { to: to, outbox: new Procession, shutdown: new Signal }
        var shifter = connection.outbox.shifter()
        // Delay because `_connect` is going to call `_connections.get`.
        setImmediate(function () {
            destructible.monitor([ 'connection', to ], true, self, '_connect', to, shifter, null)
        })
        return connection
    })
    this._destructible = destructible
    this._index = index
    destructible.destruct.wait(this, function () {
        this._diffLocations({})
    })
}

Connector.prototype.push = function (envelope) {
    if (this._router.properties[envelope.to.promise] != null) {
        this._connector.connect(envelope.to).push(envelope)
    }
}

Connector.prototype.setRoutes = function (routes) {
    this._router = new Router(routes)
    this._diffLocations(this._router.properties)
}

Connector.prototype._diffLocations = function (properties) {
    this._connections.promises().forEach(function (promise) {
        if (!(promise in properties)) {
            this._connections.list(promise).forEach(function (connection) {
                connection.outbox.end()
                connection.shutdown.unlatch()
            })
        }
    }, this)
}

Connector.prototype.connect = function (to) {
    return this._connections.get(to).outbox
}

var COUNTER = 0
Connector.prototype._connect = cadence(function (async, destructible, to, shifter) {
    var shutdown = this._connections.get(to).shutdown
    shutdown.wait(destructible, 'destroy')
    var done = destructible.monitor('retries')
    var looped = 0
    var demur = new Demur
    var sender = new Sender(destructible, this.feedback)
    var counter = ++COUNTER
    var location = url.parse(this._router.properties[to.promise].location)
    destructible.destruct.wait(sender.inbox, 'end')
    destructible.destruct.wait(demur, 'cancel')
    async([function () {
        done()
    }], function () {
        destructible.monitor([ 'window', COUNTER ], Window, sender, async())
    }, function (window) {
        destructible.destruct.wait(window, 'hangup')
        console.log('pumping', to)
        shifter.pump(sender.outbox)
        var loop = async([function () {
            async(function () {
                demur.retry(async())
            }, function () {
                if (destructible.destroyed) {
                    return [ loop.break ]
                }
                var request = http.request({
                    host: location.hostname,
                    port: +location.port,
                    headers: Downgrader.headers({
                        'x-diffuser-from-promise': this._router.from.promise,
                        'x-diffuser-from-index': this._router.from.index,
                        'x-diffuser-to-promise': to.promise,
                        'x-diffuser-to-index': to.index
                    })
                })
                delta(async()).ee(request).on('upgrade')
                request.end()
            }, function (request, socket, head) {
                var wait = null
                async(function () {
                    demur.reset()
                    var destructible = new Destructible([ 'connection', to ])
                    destructible.destruct.wait(window, 'disconnect')
                    destructible.completed.wait(async())
                    destructible.monitor('conduit', Conduit, window, socket, socket, head, null)
                    delta(destructible.monitor('socket')).ee(socket).on('close')
                    wait = shutdown.wait(destructible, 'destroy')
                }, [function () {
                    shutdown.cancel(wait)
                }])
            })
        }, function (error) {
            console.log(error.stack)
            logger.error('error', { stack: error.stack })
        }])()
    }, function () {
        this._connections.remove(to)
    })
})

module.exports = cadence(function (async, destructible, index) {
    return new Connector(destructible, index)
})
