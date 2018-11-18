// Node.js API.
var assert = require('assert')

// Control-flow utilities.
var cadence = require('cadence')
var delta = require('delta')

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
function Connector (destructible, index) {
    // Our life-cycle manager.
    this._destructible = destructible

    // The index of the child process among its siblings.
    this._index = index

    // Collection of windows.
    this._connections = new Addresser

    // Common inbox from all windows.
    this.inbox = new Procession

    // Work queue for establishing incoming connections. (We only spend a moment
    // in this queue.)
    this.turnstile = new Turnstile
    this._connecting = new Turnstile.Queue(this, '_connect', this.turnstile)

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
            this._destructible.monitor([ 'connect', to ], true, this, '_connect', to, null)
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
Connector.prototype._window = cadence(function (async, destructible, promise) {
    async(function () {
        // Construct a Window.
        destructible.monitor('window', Window, async())
    }, function (window) {
        var connection = this._connections.get(promise)

        // Keep the `Destructible` for the `Window`.
        connection.destructibles.window = destructible

        // Drain any messages waiting for the window's creation and replace the
        // initial outbox with the window's outbox.
        connection.outbox.drain(window.outbox, 'push')
        connection.outbox = window.outbox

        // We use `Window.truncate` to correctly close the `Window.inbox`. The
        // `Window.outbox` we can close directly.
        destructible.destruct.wait(window, 'truncate')
        destructible.destruct.wait(window.outbox, 'end')

        // We want to pump the `Window.inbox` into our common `inbox`, but we
        // don't want to close the common `inbox` by pushing `null` which means
        // end-of-queue.
        destructible.monitor('inbox', window.inbox.pump(this, function (envelope) {
            if (envelope != null) {
                this.inbox.push(envelope)
            }
        }), 'destructible', null)

        // If the window is destroyed, any associate socket also needs be
        // destroyed.
        destructible.destruct.wait(function () { this._get.remove(promise).destructibles.socket.destroy() })

        // Finally, we remove the window from our window collection.
        destructible.destruct.wait(this, function () { this._connections.remove(from) })
    })
})

// Construct a conduit around an incoming socket.
Connector.prototype._conduit = cadence(function (async, destructible, from, window, socket) {
    destructible.destruct.wait(socket, 'destroy')
    var windowed = this._connections.get(from)
    async(function () {
        // Wait for the existing socket to close and, yes, destroy it in case
        // we're called while it is still open.
        windowed.destructibles.socket.destroy()
        windowed.destructibles.socket.destruct.wait(async())
    }, function () {
        // Create a new socket.
        var readable = new Staccato.Readable(socket)
        var writable = new Staccato.Writable(socket)
        destructible.monitor('socket', true, Socket, { from: from }, readable, writable, async())
    }, function (inbox, outbox) {
        // Bind our socket to a Conduit server that will reconnect the window
        // and listen for pings.
        destructible.monitor('conduit', Conduit, inbox, outbox, this, cadence(function (async, request, inbox, outbox) {
                console.log('here', request)
                process.exit()
            switch (request.method) {
            case 'window':
                window.connect(inbox, outbox)
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
        this._destructible.monitor([ 'window', promise ], true, this, '_window', promise, async())
    } else {
        return windowed.window
    }
})

// TODO Really need to set some sort of panic for Turnstile, automatic panic,
// where if it gets too full it doesn't shed, it crashes.

//
Connector.prototype.socket = restrictor(cadence(function (async, envelope) {
    var message = envelope.body.vargs.shift(), socket = envelope.body.vargs.shift()
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
            destructible.monitor([ 'socket', from ], this, '_conduit', from, window, socket, async())
        })
    })
}))

// Using a Turnstile for the initialization.
//
// TODO Feel like it is time to consider whether there is some way to amalgamate
// Turnstile, Procession and Destructible, or maybe revisit where you're still
// using Turnstile to abend and insist that the user provide a callback to
// listen to run it. Also, don't you want to use a full bouquet of errors to
// report from Turnstile when it blows up?

//
Connector.prototype.socket = function (message, socket) {
    // We add `now` to our unique socket key because there maybe some overlap
    // while waiting for the previous socket to shutdown.
    this._connecting.push({ message: message, socket: socket })
}

// Note that there are three recoverable errors. The first is the request
// connection and upgrade negotiation. We have a try/catch for that error below.
// Then we can have an error on read or write to the socket. The `Socket`
// utility from Procession logs and error and ends the inbox or outbox
// procession.

//
Connector.prototype._connection = cadence(function (async, destructible, demur, to, window) {
    async([function () {
        destructible.destroy()
    }], [function () {
        var location = url.parse(this._router.properties[to.promise].location)
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
        destructible.destruct.wait(request, 'abort')
        delta(async()).ee(request).on('upgrade')
        request.end()
    }, function (error) {
        console.log(error.stack)
        logger.error('request', { stack: error.stack })
        return [ async.break, false, destructible ]
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
            return [ true, destructible ]
        })
    }, function () {
        console.log('returning', arguments)
    })
})

Connector.prototype._reconnect = restrictor(cadence(function (async, envelope) {
    var demur = new Demur({ immediate: true })
    destructible.destruct.wait(demur, 'cancel')
    var loop = cadence(function (async() {
        async(function () {
            demur.retry(async())
        }, function () {
            if (destructible.destroyed) {
                return [ loop.break ]
            }
            async(function () {
                destructible.monitor('connection', true, this, '_connection', to, window, async())
            }, function (connected, destructible) {
                if (connected) {
                    demur.reset()
                }
                destructible.completed.wait(async())
            })
        })
    })()
})

Connector.prototype._connect = restrictor(cadence(function (async, envelope) {
    var to = envelope.body.vargs.shift()
    async(function () {
        this._getOrCreateWindow(to, async())
    }, function (connection) {
        connection.destructibles.window.monitor('reconnect', this._reconnect, to)
        // Client side destructible is the entire reconnect loop, not an
        // individual socket.
        connection.destructibles.socket = destructible

        var loop = async(function () {
            async(function () {
                demur.retry(async())
            }, function () {
            }, function (connected, destructible) {
                if (connected) {
                    demur.reset()
                }
            })
        })()
    }, function () {
        this._connections.remove(to)
    })
}))

module.exports = cadence(function (async, destructible, index) {
    return new Connector(destructible, index)
})
