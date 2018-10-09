require('proof')(2, prove)

function prove (okay, callback) {
    var Destructible = require('destructible')
    var destructible = new Destructible(2000, 't/connection.t')

    var delta = require('delta')

    var Operation = require('operation')
    var Downgrader = require('downgrader')

    destructible.completed.wait(callback)

    var cadence = require('cadence')

    var Connectee = require('../connectee')
    var Connector = require('../connector')

    var destroyer = require('server-destroy')

    cadence(function (async) {
        async(function () {
            destructible.monitor('connectee', Connectee, async())
        }, function (connectee) {
            var fail = { connectee: 0, connector: false }
            var http = require('http')

            var downgrader = new Downgrader
            downgrader.on('socket', function (request, socket) {
                connectee.socket({
                    from: {
                        promise: request.headers['x-diffuser-from-promise'],
                        index: +request.headers['x-diffuser-from-index']
                    },
                    to: {
                        promise: request.headers['x-diffuser-to-promise'],
                        index: +request.headers['x-diffuser-to-index']
                    }
                }, socket)
                if (fail.connectee != 0) {
                    fail.connectee--
                    setImmediate(function () { socket.emit('error', new Error('error')) })
                }
            })

            var server = http.createServer(function () {})
            destroyer(server)

            server.on('upgrade', Operation([ downgrader, 'upgrade' ]))

            delta(destructible.monitor('http')).ee(server).on('close')
            destructible.destruct.wait(server, 'destroy')

            var to = { promise: '1/0', index: 1 }
            var from = { promise: '0/0', index: 0 }
            async(function () {
                destructible.monitor('connector', Connector, from, async())
            }, function (connector) {
                async(function () {
                    connectee.inbox.shifter().dequeue(async())
                    connector.setLocations({
                        '1/0': 'http://127.0.0.1:8089/',
                        '2/0': 'http://127.0.0.1:8089/'
                    })
                    var outbox = connector.connect(to)
                    outbox.push(1)
                    async(function () {
                        setTimeout(async(), 2500)
                    }, function () {
                        server.listen(8089, '127.0.0.1', async())
                    })
                }, function (value) {
                    okay(value, 1, 'pushed')
                    // Set locations with no change.
                    connector.setLocations({
                        '1/0': 'http://127.0.0.1:8089/',
                        '2/0': 'http://127.0.0.1:8089/'
                    })
                    // Set locations so that we hang up on `1/0`.
                    connector.setLocations({
                        '2/0': 'http://127.0.0.1:8089/'
                    })
                    connectee.setLocations({
                        '2/0': 'http://127.0.0.1:8089/'
                    })
                    setTimeout(async(), 2500)
                }, function () {
                    to = { promise: '2/0', index: 0 }
                    fail.connectee = 1
                    connectee.inbox.shifter().dequeue(async())
                    connector.connect(to)
                    var outbox = connector.connect(to)
                    outbox.push(2)
                }, function (value) {
                    okay(value, 2, 'second push')
                })
            })
        })
    })(destructible.monitor('test'))
}
