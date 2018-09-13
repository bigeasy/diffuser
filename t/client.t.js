require('proof')(3, prove)

function prove (okay, callback) {
    var Client = require('../client')

    var Destructible = require('destructible')
    var destructible = new Destructible('t/client.t')

    destructible.completed.wait(callback)

    var cadence = require('cadence')

    var queue = []

    var setLocation = 1

    function Connection (location, shifter) {
        okay(location, setLocation, 'set location ' + setLocation)
        setLocation++
        shifter.pump(function (envelope) {
            queue.push(envelope)
        }, destructible.monitor([ 'queue', location ]))
    }

    cadence(function (async) {
        async(function () {
            destructible.monitor('client', Client, Connection, async())
        }, function (client) {
            client.setLocations({ '1/0': 1, '2/0': 2 })
            client.push({ to: '1/0', body: 1 })
            client.push({ to: '1/0', body: 2 })
            client.push({ to: '2/0', body: 1 })
            client.hangup([ '2/0' ])
            okay(queue, [{
                to: '1/0', body: 1
            }, {
                to: '1/0', body: 2
            }, {
                to: '2/0', body: 1
            }, null], 'queue')
            client.hangup([])
        })
    })(destructible.monitor('test'))
}
