// Node.js API.
var assert = require('assert')
var http = require('http')
var url = require('url')

// Control-flow utilities.
var cadence = require('cadence')
var delta = require('delta')

// Downgrade HTTP to a plain socket.
var Downgrader = require('downgrader')

// Sockets as multiplexed event queues.
var Procession = require('procession')
var Conduit = require('conduit/conduit')
var Socket = require('procession/socket')(require('./hangup'))
var Window = require('conduit/window')

var Monotonic = require('monotonic').asString

var logger = require('prolific.logger').createLogger('diffuser')

// Controlled demoltion of evented objects.
var Destructible = require('destructible')

var Staccato = require('staccato')

var Router = require('./lookup')
var Addresser = require('./addresser')

var Turnstile = require('turnstile')
Turnstile.Queue = require('turnstile/queue')

var Demur = require('demur')

var restrictor = require('restrictor')

// Exceptions you can catch by type.
var Interrupt = require('interrupt').createInterrupter('diffuser')

// Our constructor is invoked by the `Destructible` constructor we export. This
// object is only supposed to be created by and used with `Destructible`.
//
// The `_connections` collection is a collection of windows and conduits. A
// window represents a message queue for messages received for another diffuser
// participant, one of our peers. It's called a window because our peer
// maintains a queue of messages that are only cleared when assure it that the
// messages have been received. This is a "window" of messages in the stream.
//
// If our socket to a particular peer breaks, it will create a new socket to
// reconnect to us and resume communication. Its window will replay the queued
// messages and the window on our side end will skip over the ones it has
// already received.
//
// The `Window` class is bi-directional, but we're only really sending
// information in one direction through each socket. This means that each
// pairing of peers will open two sockets. Maybe some day we'll sort out how to
// open only one socket to use each way, but it is easier to open a socket in
//
// Our `_connections` collection is keyed on promise and process index. A
// promise is the unique key in the atomic log that introduced a our peer as a
// new participant. We call this unique key a promise because that's what Paxos
// calls it. The process index indicates the index of a child process in a
// multi-worker child model.

//
function Connector (destructible, island, index) {
    // Our life-cycle manager.
    this._destructible = destructible

    // The index of the child process among its siblings.
    this._index = index

    this._island = island

    // Collection of windows.
    this._connections = new Addresser

    // Common inbox from all windows.
    this.inbox = new Procession

    // Work queue for establishing incoming connections. (We only spend a moment
    // in this queue.)
    this.turnstile = new Turnstile
    this.turnstile.listen(destructible.durable('turnstile'))
    destructible.destruct.wait(this.turnstile, 'destroy')

    // Close all windows when it's time to go.
    destructible.destruct.wait(this, function () { this._diffLocations({}) })
}

// Invoked when a new routing table is created. We will close any windows open
// to instances that no longer exist.

//
Connector.prototype.setRoutes = function (routes) {
    this._router = new Router(routes, this._index)
    this._diffLocations(routes.properties)
}

// Close any open windows that do not have a value for their promise

//
Connector.prototype._diffLocations = function (properties) {
    this._connections.promises().forEach(function (promise) {
        if (!(promise in properties)) {
            this._connections.list(promise).forEach(function (connection) {
                connection.destructibles.window.destroy()
                this._connections.remove(connection.address)
            }, this)
        }
    }, this)
}

// Get a connection or construct one if one does not exist. The absence of a
// `window` property will serve to indicate that the connection needs to be
// networked.

//
Connector.prototype._getConnection = function (address) {
    // Get the existing connection.
    var connection = this._connections.get(address)

    // Create a connection if none exists.
    if (connection == null) {
        // This outbox will be replaced with the window's outbox once it's
        // created.
        var outbox = new Procession
        this._connections.put(address, connection = {
            address: address,
            window: null,
            outbox: outbox,
            shifter: outbox.shifter(),
            destructibles: {
                window: new Destructible('dummy'),
                socket: new Destructible('dummy')
            }
        })
    }

    return connection
}

// Push is synchronous. If there is no connection we create one and push events
// into an interim outbox. We use one socket for each pairing. The participant
// with the lesser promise initiates the connection. We also initiate a
// connection if the participant it connecting to itself.

//
Connector.prototype.push = function (envelope) {
    var to = envelope.to
    // Drop the message if the destination has been removed from the routing
    // table.
    if (this._router.properties[to.promise] != null) {
        var connection = this._getConnection(to)

        // If we have no window and our promise is less than our peers, we
        // connect, otherwise we wait for our peer to connect to us.
        if (connection.window == null && Monotonic.compare(this._router.from.promise, to.promise) <= 0) {
            this._connect(to)
        }

        connection.outbox.push(envelope)
    }
}

// Windows are queues that survive network failures. Because they can outlive
// their underlying sockets they are created with a destructible
//  We build it under it's
// own destructible invoked below as a destructible that can terminate
// independently of the application. Note that we keep the sub-destructible in
// our window collection so we can close the window and destroy all it's helpers
// when it comes time to shutdown.

//
Connector.prototype._window = cadence(function (async, destructible, connection) {
    // Keep the `Destructible` for our window, maybe call it connection, or
    // pipe, need more words.
    connection.destructibles.window = destructible
    async(function () {
        // Construct a Window.
        destructible.durable('window-z', Window, async())
    }, function (window) {
        connection.window = window

        // Drain any messages waiting for the window's creation and replace the
        // initial outbox with the window's outbox.
        connection.shifter.drain(window.outbox, 'push')
        connection.outbox = window.outbox

        // We use `Window.truncate` to correctly close the `Window.inbox`. The
        // `Window.outbox` we can close directly.
        destructible.destruct.wait(window, 'truncate')
        destructible.destruct.wait(window.outbox, 'end')

        // We want to pump the `Window.inbox` into our common `inbox`, but we
        // don't want to close the common `inbox` by pushing `null` which means
        // end-of-queue.
        destructible.durable('inbox', window.inbox.pump(this, function (envelope) {
            if (envelope != null) {
                this.inbox.push(envelope)
            }
        }), 'destructible', null)

        return [ connection ]
    })
})

// Construct a conduit around an incoming socket.
Connector.prototype._conduit = cadence(function (async, destructible, connection, socket) {
    socket.steve = 'steve'
    async(function () {
        // Create a new socket.
        var readable = new Staccato.Readable(socket)
        var writable = new Staccato.Writable(socket)
        // TODO How does destroying writable cause the socket to close?
        destructible.destruct.wait(readable, 'destroy')
        destructible.destruct.wait(writable, 'destroy')
        // destructible.destruct.wait(socket, 'destroy')
        destructible.ephemeral('socket', Socket, { from: connection.address }, readable, writable, async())
    }, function (inbox, outbox) {
        outbox.push({ module: 'diffuser', method: 'connect' })
        // Bind our socket to a Conduit server that will reconnect the window
        // and listen for pings.
        destructible.durable('conduit', Conduit, inbox, outbox, this, cadence(function (async, request, inbox, outbox) {
            switch (request.method) {
            case 'window':
                connection.window.connect(inbox, outbox)
                break
            case 'ping':
                // TODO Ping.
                break
            }
        }), async())
    })
})

// If we construct a window, it's `Destructible` is a child of our main
// `Destructible`, not the child `Destructible` for the specific socket. A
// Window is supposed to outlive a socket and reconnect if the socket breaks but
// recovery is possible, so both the socket and window a destructibly children
// of our `Connector` object manager.
Connector.prototype._getOrCreateWindow = cadence(function (async, promise) {
    var connection = this._getConnection(promise)
    if (connection.window == null) {
        // As noted above, the `Window` is a child of the `Connector`, not
        // the `Socket`.
        this._destructible.ephemeral([ 'window-xxxx', promise ], this, '_window', connection, async())
    } else {
        return connection
    }
})

// TODO Really need to set some sort of panic for Turnstile, automatic panic,
// where if it gets too full it doesn't shed, it crashes.

//
Connector.prototype.socket = restrictor.push(cadence(function (async, envelope) {
    if (!envelope.canceled) {
        var message = envelope.body.shift(), socket = envelope.body.shift()
        var from = message.from
        async(function () {
            // Get or create the window.
            this._getOrCreateWindow(from, async())
        }, function (connection) {
            // Wait for the previous socket to shutdown.
            async(function () {
                connection.destructibles.socket.destroy()
                connection.destructibles.socket.completed.wait(async())
            }, function () {
                connection.destructibles.window.ephemeral([ 'socket', from ], this, '_conduit', connection, socket, async())
            })
        })
    }
}))

// Note that there are three recoverable errors. The first is the request
// connection and upgrade negotiation. We have a try/catch for that error below.
// Then we can have an error on read or write to the socket. The `Socket`
// utility from Procession logs and error and ends the inbox or outbox
// procession.

//
Connector.prototype._connection = cadence(function (async, destructible, connection) {
    var location = url.parse(this._router.properties[connection.address.promise].location)
    var abort
    async([function () {
        var request = http.request({
            host: location.hostname,
            port: +location.port,
            headers: Downgrader.headers({
                'x-diffuser-from-promise': this._router.from.promise,
                'x-diffuser-from-index': this._router.from.index == connection.address.index ? 'self' : this._router.from.index,
                'x-diffuser-to-promise': connection.address.promise,
                'x-diffuser-to-index': connection.address.index
            })
        })
        abort = destructible.destruct.wait(request, 'abort')
        delta(async()).ee(request).on('upgrade')
        request.end()
    }, function (error) {
        destructible.destroy()
        console.log(error.stack)
        logger.error('request', { stack: error.stack })
        return [ async.break, false, destructible ]
    }], function (request, socket, head) {
        destructible.destruct.cancel(abort)
        var wait = null
        async(function () {
            var readable = new Staccato.Readable(socket)
            var writable = new Staccato.Writable(socket)
            destructible.destruct.wait(readable, 'destroy')
            destructible.durable('socket', Socket, { to: console.address, location: location }, readable, writable, head, async())
        }, function (inbox, outbox) {
            async(function () {
                inbox.dequeue(async())
            }, function (envelope) {
                if (envelope == null) {
                    return [ async.break, false, destructible ]
                }
                Interrupt.assert(envelope.module + '/' + envelope.method == 'diffuser/connect', 'bad.handshake')
                destructible.durable('conduit', Conduit, inbox, outbox, async())
            }, function (conduit) {
                var request = conduit.connect({ method: 'window', inbox: true, outbox: true })
                connection.window.connect(request.inbox, request.outbox)
                return [ true, destructible ]
            })
        })
    })
})

Connector.prototype._reconnect = cadence(function (async, destructible, connection) {
    var demur = new Demur({ immediate: true })
    destructible.destruct.wait(demur, 'cancel')
    async.loop([], function () {
        async(function () {
            demur.retry(async())
        }, function () {
            if (destructible.destroyed) {
                return [ async.break ]
            }
            async(function () {
                destructible.ephemeral('connection', this, '_connection', connection, async())
            }, function (connected, destructible) {
                if (connected) {
                    demur.reset()
                }
                destructible.completed.wait(async())
            })
        })
    })
})

Connector.prototype._connect = restrictor.push(cadence(function (async, envelope) {
    var to = envelope.body.shift()
    if (!envelope.canceled) {
        async(function () {
            this._getOrCreateWindow(to, async())
        }, function (connection) {
            connection.destructibles.window.durable('reconnect', this, '_reconnect', connection, null)
        })
    }
}))

module.exports = cadence(function (async, destructible, index) {
    return new Connector(destructible, null, index)
})
