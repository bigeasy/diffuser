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
            case 'sent':
                this._tracker.record(json.cookie, 'sent')
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
            console.log('serve', json)
            switch (json.method) {
            case 'send':
                writable.write(JSON.stringify({
                    method: 'sent',
                    cookie: json.cookie
                }) + '\n', async())
                break
            }
        }, function () {
            console.log('DID WROTE!!!')
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
            console.log('waiting')
            this._timeout = setTimeout(this._delay.notify.bind(this._delay), 1000)
        }, function () {
            console.log('requesting')
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
                console.log(addresses)
                async.forEach([ addresses ], function (address) {
                    async(function () {
                        if (this._clients[address]) {
                            return [ this._clients[address] ]
                        }
                        this._destructable.ephemeral(address, this, 'connect', address, async())
                    }, function (client) {
                        if (client == null) {
                            return [ async.continue ]
                        }
                        var cookie = this._tracker.request(address, this._address)
                        client.writable.write(JSON.stringify({
                            method: 'send',
                            to: address,
                            from: this._address,
                            cookie: cookie
                        }) + '\n', async())
                    }, function () {
                        console.log('WROTE TO', address)
                    })
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
    console.log('constructing!!!', address)
    var worker = new Worker(destructible, tracker, diffuser, resolver, address)
    worker.request(destructible.durable('request'))
    return worker
})
