require('proof')(1, prove)

function prove (okay, callback) {
    var Destructible = require('destructible')
    var destructible = new Destructible('t/connection.t')

    var delta = require('delta')

    var Operation = require('operation')
    var Downgrader = require('downgrader')

    destructible.completed.wait(callback)

    var cadence = require('cadence')

    var Listener = require('../listener')
    var Connector = require('../connector')

    cadence(function (async) {
        async(function () {
            destructible.monitor('listener', Listener, async())
        }, function (listener) {
            var http = require('http')

            var downgrader = new Downgrader
            downgrader.on('socket', function (request, socket) {
                console.log('XXXX')
                listener.socket({
                    to: {
                        promise: request.headers['x-diffuser-to-promise'],
                        index: +request.headers['x-diffuser-to-index']
                    }
                }, socket)
            })

            var server = http.createServer(function () {})
            server.on('upgrade', Operation([ downgrader, 'upgrade' ]))

            delta(destructible.monitor('http')).ee(server).on('close')
            destructible.destruct.wait(server, 'close')

            var Keyify = require('keyify')
            var key = { promise: '1/0', index: 0 }
            var hash = {
                key: key,
                stringified: Keyify.stringify(key)
            }
            async(function () {
                server.listen(8089, '127.0.0.1', async())
            }, function () {
                destructible.monitor('connector', Connector, async())
            }, function (connector) {
                async(function () {
                    listener.inbox.shifter().dequeue(async())
                    connector.setLocations({ '1/0': 'http://127.0.0.1:8089/' })
                    var outbox = connector.connect(hash)
                    outbox.push(1)
                }, function (value) {
                    okay(value, 1, 'pushed')
                    console.log('dequeued', value)
                    connector.connect(hash).push(null)
                })
            })
        })
    })(destructible.monitor('test'))
}
