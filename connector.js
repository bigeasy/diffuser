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

var Addresser = require('./addresser')

var Router = require('./lookup')

var Socket = require('procession/socket')(require('./hangup'))

var Staccato = require('staccato')

function Connector (destructible, index) {
    this.feedback = new Procession
    var self = this
    this._connections = new Addresser
    this._destructible = destructible
    this._index = index
    console.log('x')
    destructible.destruct.wait(this, function () {
        this._diffLocations({})
    })
}

Connector.prototype.push = function (envelope) {
    if (this._router.properties[envelope.to.promise] != null) {
        this.connect(envelope.to).push(envelope)
    }
}

Connector.prototype.setRoutes = function (routes) {
    this._router = new Router(routes, this._index)
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
    var connection = this._connections.get(to)
    if (connection == null) {
        connection = { to: to, outbox: new Procession, shutdown: new Signal }
        this._connections.put(to, connection)
        var shifter = connection.outbox.shifter()
        this._destructible.monitor([ 'connection', to ], true, this, '_connect', to, shifter, null)
    }
    return connection.outbox
}

Connector.prototype._connection = cadence(function (async, destructible, demur, to, window) {
    console.log('looping')
    var location = url.parse(this._router.properties[to.promise].location)
    async([function () {
    }], function () {
    async([function () {
        destructible.destroy()
    }], [function () {
        console.log('retries')
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
        console.log('--- getting ---')
    }, function (error) {
        console.log(error.stack)
        logger.error('request', { stack: error.stack })
        return [ async.break, destructible ]
    }], function (request, socket, head) {
        console.log('socketed')
        var wait = null
        async(function () {
            demur.reset()
            var readable = new Staccato.Readable(socket)
            var writable = new Staccato.Writable(socket)
            destructible.monitor('socket', true, Socket, { to: to, location: location }, readable, writable, head, async())
        }, function (inbox, outbox) {
            destructible.monitor('conduit', Conduit, inbox, outbox, async())
        }, function (conduit) {
            var connection = conduit.connect({ method: 'window', inbox: true, outbox: true })
            window.connect(connection.inbox, connection.outbox)
            return [ destructible ]
        })
    })
    }, function () {
        console.log('returning', arguments)
    })
})

var COUNTER = 0
Connector.prototype._connect = cadence(function (async, destructible, to, shifter) {
    var shutdown = this._connections.get(to).shutdown
    shutdown.wait(destructible, 'destroy')
    var done = destructible.monitor('retries')
    var looped = 0
    var demur = new Demur({ immediate: true })
    var sender = new Sender(destructible, this.feedback)
    var counter = ++COUNTER
    var location = url.parse(this._router.properties[to.promise].location)
    destructible.destruct.wait(sender.inbox, 'end')
    destructible.destruct.wait(function () {
        console.log('cancel demur')
    })
    destructible.destruct.wait(demur, 'cancel')
    async([function () {
        done()
    }], function () {
        destructible.monitor('window', Window, sender, async())
    }, function (window) {
        var connection = this._connections.get(to)
        shifter.drain(connection.outbox = window.outbox, 'push')
        // Note that there are three recoverable errors. The first is the
        // request connection and upgrade negotiation. We have a try/catch for
        // that error below. Then we can have an error on read or write to the
        // socket. The `Socket` utility from Procession logs and error and ends
        // the inbox or outbox procession.
        //
        // TODO We probably should put the loop body it's own function and
        // return the destructible, then wait on the destructible to complete.
        // We can then add a cancel of the http request to the nested
        // destructible destruct latch.
        destructible.destruct.wait(window, 'truncate')
        var loop = async(function () {
            async(function () {
                console.log('here')
                demur.retry(async())
            }, function () {
                console.log('retries')
                if (destructible.destroyed) {
                    return [ loop.break ]
                }
                destructible.monitor('connection', true, this, '_connection', demur, to, window, async())
            }, function (destructible) {
                console.log(destructible.completed.open)
                destructible.completed.wait(async())
            })
        })()
    }, function () {
        this._connections.remove(to)
    })
})

module.exports = cadence(function (async, destructible, index) {
    try {
    console.log('x')
    return new Connector(destructible, index)
     } catch (e) {
        console.log(e.stack)
     }
    console.log('x')
})
