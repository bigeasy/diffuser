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

function Connector (destructible, promise, index) {
    this.feedback = new Procession
    this._connections = {}
    this._destructible = destructible
    this._promise = promise
    this._index = index
    destructible.destruct.wait(this, function () {
        this.setLocations({})
    })
}

Connector.prototype.setLocations = function (locations) {
    for (var key in this._connections) {
        var connection = this._connections[key]
        if (!(connection.hash.key.promise in locations)) {
            connection.outbox.end()
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
            shutdown: new Signal
        }
        var shifter = connection.outbox.shifter()
        this._destructible.monitor([ 'connector-?', hash.key ], true, this, '_connect', hash, shifter, null)
    }
    return connection.outbox
}

var COUNTER = 0
Connector.prototype._connect = cadence(function (async, destructible, hash, shifter) {
    var shutdown = this._connections[hash.stringified].shutdown
    shutdown.wait(destructible, 'destroy')
    var done = destructible.monitor('retries')
    var looped = 0
    var demur = new Demur
    var sender = new Sender(destructible, this.feedback)
    var counter = ++COUNTER
    var location = url.parse(this._locations[hash.key.promise])
    destructible.destruct.wait(sender.inbox, 'end')
    destructible.destruct.wait(demur, 'cancel')
    async([function () {
        done()
    }], function () {
        destructible.monitor([ 'window', COUNTER ], Window, sender, async())
    }, function (window) {
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
                        'x-diffuser-from-promise': this._promise,
                        'x-diffuser-from-index': this._index,
                        'x-diffuser-to-promise': hash.key.promise,
                        'x-diffuser-to-index': hash.key.index
                    })
                })
                delta(async()).ee(request).on('upgrade')
                request.end()
            }, function (request, socket, head) {
                var wait = null
                async(function () {
                    demur.reset()
                    var destructible = new Destructible([ 'connection', hash.key ])
                    destructible.completed.wait(async())
                    destructible.monitor('conduit', Conduit, window, socket, socket, head, null)
                    delta(destructible.monitor('socket')).ee(socket).on('close')
                    // wait = shutdown.wait(destructible, 'destroy')
                }, [function () {
                    // shutdown.cancel(wait)
                }])
            })
        }, function (error) {
            logger.error('error', { stack: error.stack })
        }])()
    }, function () {
        delete this._connections[hash.stringified]
    })
})

module.exports = cadence(function (async, destructible, promise, index) {
    return new Connector(destructible, promise, index)
})
