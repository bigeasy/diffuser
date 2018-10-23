var cadence = require('cadence')
var Receiver = require('./receiver')
var Procession = require('procession')
var Conduit = require('conduit/conduit')
var logger = require('prolific.logger').createLogger('diffuser')
var Destructible = require('destructible')
var delta = require('delta')
var assert = require('assert')

var Window = require('conduit/window')

var Connections = require('./connections')

function Connectee (destructible) {
    this._destructible = destructible
    this._connections = new Connections
    this._windows = new Connections
    this.inbox = new Procession
    destructible.destruct.wait(this, function () {
        this._diffLocations({})
    })
}

Connectee.prototype.setRoutes = function (routes) {
    this._diffLocations(routes.properties)
}

Connectee.prototype._diffLocations = function (properties) {
    this._diffCollection(this._windows, properties)
    this._diffCollection(this._connections, properties)
}

Connectee.prototype._diffCollection = function (collection, properties) {
    collection.promises().forEach(function (promise) {
        if (!(promise in properties)) {
            collection.list(promise).forEach(function (connection) {
                connection.destructible.destroy()
            })
        }
    })
}

Connectee.prototype._window = cadence(function (async, destructible, from) {
    async(function () {
        var receiver = new Receiver(destructible, this.inbox)
        destructible.monitor([ 'window', from ], Window, receiver, async())
    }, function (window) {
        this._windows.put(from, { destructible: destructible, window: window })
        destructible.destruct.wait(window, 'hangup')
        destructible.destruct.wait(this, function () {
            this._windows.remove(from)
        })
    })
})

Connectee.prototype._conduit = cadence(function (async, destructible, window, socket) {
    async(function () {
        destructible.monitor('conduit', Conduit, window, socket, socket, async())
    }, function (conduit) {
        destructible.destruct.wait(conduit, 'hangup')
        window.reconnect()
    })
})

// TODO Really need to set some sort of panic for Turnstile, automatic panic,
// where if it gets too full it doesn't shed, it crashes.
Connectee.prototype._socket = cadence(function (async, destructible, message, socket) {
    this._connections.put(message.from, { destructible: destructible })
    destructible.destruct.wait(this, function () {
        this._connections.remove(message.from)
    })
    async(function () {
        var windowed = this._windows.get(message.from)
        if (windowed == null) {
            this._destructible.monitor([ 'window', message.from ], true, this, '_window', message.from, async())
        } else {
            return windowed.window
        }
    }, function (window) {
        // Uncertain about errors in this case. There may be times when there is
        // an error in the Conduit but that does not cause the socket to close.
        //
        // We have to use an independent destructible because there is no other
        // way to catch the composition of errors that would come out of Conduit
        // which uses a destructible constructor.
        //
        // TODO Haven't really sorted out who shuts down Windows and Conduits
        // yet.
        async([function () {
            var destructible = new Destructible(800, [ 'conduit', message.from ])
            destructible.destruct.wait(window, 'disconnect')
            destructible.completed.wait(async())
            destructible.monitor('conduit', this, '_conduit', window, socket, null)
            // delta(destructible.monitor('socket')).ee(socket).on('close')
        }, function (error) {
            console.log(error.stack)
            socket.destroy()
            logger.error('socket', { stack: error.stack })
        }])
    })
})

// Using a Turnstile for the initialization.
//
// TODO Feel like it is time to consider whether there is some way to amalgamate
// Turnstile, Procession and Destructible, or maybe revisit whhere you're still
// using Turnstile to abend and insist that the user provide a callback to
// listen to run it. Also, don't you want to use a full bouquet of errors to
// report from Turnstile when it blows up?
Connectee.prototype.socket = function (message, socket) {
    var connection = this._connections.get(message.from)
    if (connection != null) {
        connection.destructible.destroy()
    }
    assert(this._connections.get(message.from) == null)
    // We add `now` because there maybe some overlap while waiting for
    // asynchronous operations to shutdown.
    this._destructible.monitor([ 'socket', message.from, Date.now() ], true, this, '_socket', message, socket, null)
}

module.exports = cadence(function (async, destructible) {
    return new Connectee(destructible)
})
