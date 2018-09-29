var cadence = require('cadence')
var Receiver = require('./receiver')
var Procession = require('procession')
var Conduit = require('conduit/conduit')
var logger = require('prolific.logger').createLogger('diffuser')
var Destructible = require('destructible')
var delta = require('delta')

var Window = require('conduit/window')

// Evented work queue.
var Turnstile = require('turnstile')
Turnstile.Queue = require('turnstile/queue')

var Hash = require('./hash')

function Connectee (destructible) {
    this._destructible = destructible
    this._windows = {}
    this.inbox = new Procession
    this.turnstile = new Turnstile
    this._sockets = new Turnstile.Queue(this, '_socket', this.turnstile)
    this.turnstile.listen(destructible.monitor('sockets'))
}

Connectee.prototype._window = cadence(function (async, destructible, hash) {
    async(function () {
        var receiver = new Receiver(destructible, this.inbox)
        this._destructible.monitor([ 'window', hash.key ], true, Window, receiver, async())
    }, function (window) {
        this._windows[hash.stringified] = window
    })
})

Connectee.prototype._conduit = cadence(function (async, destructible, window, socket) {
    async(function () {
        destructible.monitor('conduit', Conduit, window, socket, socket, async())
    }, function () {
        window.reconnect()
    })
})

// TODO Really need to set some sort of panic for Turnstile, automatic panic,
// where if it gets too full it doesn't shed, it crashes.
Connectee.prototype._socket = cadence(function (async, envelope) {
    var message = envelope.body.message, socket = envelope.body.socket
    var hash = Hash(message.from)
    async(function () {
        var window = this._windows[hash.stringified]
        console.log('--- have window ---', !! window)
        if (window == null) {
            this._destructible.monitor([ 'window', message.from ], true, this, '_window', hash, async())
        } else {
            return window
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
            var destructible = new Destructible([ 'conduit', message.from ])
            destructible.completed.wait(async())
            destructible.monitor('socket', this, '_conduit', window, socket, null)
            delta(destructible.monitor('conduit')).ee(socket).on('close')
        }, function (error) {
            socket.destroy()
            logger.error('socket', { stack: error.stack })
        }])
    }, function () {
        console.log('-- ooo --', hash)
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
    this._sockets.push({ message: message, socket: socket })
}

module.exports = cadence(function (async, destructible) {
    return new Connectee(destructible)
})
