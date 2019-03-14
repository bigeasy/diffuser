Error.stackTraceLimit = Infinity

var cadence = require('cadence')
var Signal = require('signal')
var net = require('net')
var url = require('url')
var delta = require('delta')
var Staccato = require('staccato')
var byline = require('byline')
var logger = require('prolific.logger').createLogger('dummy')

function Worker (destructible, tracker, diffuser, mingle, address) {
    this._tracker = tracker
    this._destructable = destructible
    this._diffuser = diffuser
    this._delay = new Signal
    this._address = address
    this._mingle = mingle
    this._instance = '0'
    this._clients = {}
}

Worker.prototype.receive = cadence(function (async, socket, writable) {
    var readable = new Staccato.Readable(byline(socket))
    async.loop([], function () {
        async(function () {
            readable.read(async())
        }, function (line) {
            if (line == null) {
                return [ async.break ]
            }
            var json = JSON.parse(line.toString())
            switch (json.method) {
            case 'received':
                this._tracker.record(json.cookie, json.from, 'received')
                break
            }
        })
    })
})

Worker.prototype.serve = cadence(function (async, socket) {
    var readable = new Staccato.Readable(byline(socket))
    var writable = new Staccato.Writable(socket)
    async.loop([], function () {
        async(function () {
            readable.read(async())
        }, function (line) {
            if (line == null) {
                return [ async.break ]
            }
            var json = JSON.parse(line.toString())
            switch (json.method) {
            case 'send':
                writable.write(JSON.stringify({
                    method: 'received',
                    from: this._address,
                    cookie: json.cookie
                }) + '\n', async())
                break
            }
        })
    })
})

Worker.prototype.socket = function (socket) {
    this.serve(socket, this._destructable.ephemeral([ 'socket', socket.remoteAddress ]))
}

Worker.prototype.connect = cadence(function (async, destructible, address) {
    var socket = new net.Socket
    async([function () {
        async(function () {
            delta(async()).ee(socket).on('connect')
            socket.connect(8080, address)
        }, function () {
            destructible.destruct.wait(this, function () {
                delete this._clients[address]
            })
            var writable = new Staccato.Writable(socket)
            this._clients[address] = {
                address: address,
                socket: socket,
                writable: writable
            }
            this.receive(socket, writable, destructible.durable('receive'))
        }, function () {
            return [ this._clients[address] ]
        })
    }, function (error) {
        console.log(error.stack)
        return [ null ]
    }])
})

Worker.prototype.request = cadence(function (async) {
    async.loop([], function () {
        async(function () {
            this._delay.wait(async())
            this._timeout = setTimeout(this._delay.notify.bind(this._delay), 1000)
        }, function () {
            this._timeout = null
            if (this.destroyed) {
                return [ async.break ]
            }
            async(function () {
                this._mingle.connect({}).inbox.dequeue(async())
            }, function (endpoints) {
                var addresses = endpoints.map(function (endpoint) {
                    return url.parse(endpoint).hostname
                })
                async.map([ addresses ], function (address) {
                    if (this._clients[address]) {
                        return [ this._clients[address] ]
                    }
                    this._destructable.ephemeral(address, this, 'connect', address, async())
                })
            }, function (clients) {
                clients = clients.filter(function (client) {
                    return client != null
                })
                var addresses = clients.map(function (client) {
                    return client.address
                })
                var requests = this._tracker.request(this._address, addresses)
                async.forEach([ clients ], function (client) {
                    client.writable.write(requests[client.address], async())
                })
            })
        })
    })
})

Worker.prototype.destroy = function () {
    if (this._timeout != null) {
        clearTimeout(this._timeout)
    }
    this.delay.unlatch()
    this.destroyed = true
}

module.exports = cadence(function (async, destructible, tracker, diffuser, resolver, address) {
    var worker = new Worker(destructible, tracker, diffuser, resolver, address)
    worker.request(destructible.durable('request'))
    return worker
})
