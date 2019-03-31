require('proof')(1, prove)

function prove (okay, callback) {
    var Destructible = require('destructible')
    var destructible = new Destructible(2000, 't/connection.t')

    var delta = require('delta')

    var Downgrader = require('downgrader')

    destructible.completed.wait(callback)

    var cadence = require('cadence')

    var Connector = require('../connector')

    var destroyer = require('server-destroy')

    cadence(function (async) {
        async(function () {
            destructible.durable('connector', Connector, 1, async())
        }, function (connectee) {
            var fail = { connectee: 0, connector: false }
            var http = require('http')

            var downgrader = new Downgrader
            downgrader.on('socket', function (request, socket) {
                console.log('connecteed')
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

            server.on('upgrade', downgrader.upgrade.bind(downgrader))

            delta(destructible.durable('http')).ee(server).on('close')
            destructible.destruct.wait(server, 'destroy')

            var to = { promise: '1/0', index: 1 }
            var from = { promise: '0/0', index: 0 }
            async(function () {
                destructible.durable('connector', Connector, 0, async())
            }, function (connector) {
                async(function () {
                    connectee.inbox.shifter().dequeue(async())
                    connector.setRoutes({
                        self: '1/0',
                        properties: {
                            '1/0': { location: 'http://127.0.0.1:8089/' },
                            '2/0': { location: 'http://127.0.0.1:8089/' }
                        },
                        event: {}
                    })
                    connector.push({ to: { promise: '1/0', index: 1 }, body: 1 })
                    async(function () {
                        setTimeout(async(), 2500)
                    }, function () {
                        server.listen(8089, '127.0.0.1', async())
                    }, function () {
                        console.log('listening')
                    })
                }, function (value) {
                    okay(value.body, 1, 'pushed')
                    // Set locations with no change.
                    connector.setRoutes({
                        properties: {
                            '1/0': { location: 'http://127.0.0.1:8089/' },
                            '2/0': { location: 'http://127.0.0.1:8089/' }
                        },
                        event: {}
                    })
                    // Set locations so that we hang up on `1/0`.
                    connector.setRoutes({
                        properties: {
                            '2/0': { location: 'http://127.0.0.1:8089/' }
                        },
                        event: {}
                    })
                    connector.setRoutes({
                        properties: {
                            '2/0': { location: 'http://127.0.0.1:8089/' }
                        },
                        event: {}
                    })
                    setTimeout(async(), 2500)
                }, function () {
                /*
                    to = { promise: '2/0', index: 0 }
                    fail.connectee = 1
                    connectee.inbox.shifter().dequeue(async())
                    connector.push({ to: to, body: 1 })
                }, function (value) {
                    okay(value, 2, 'second push')
*/
                })
            })
        })
    })(destructible.durable('test'))
}
