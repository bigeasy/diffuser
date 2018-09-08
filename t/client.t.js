require('proof')(1, prove)

function prove (okay, callback) {
    var Client = require('../client')

    var Destructible = require('destructible')
    var destructible = new Destructible('t/client.t')

    destructible.completed.wait(callback)

    var cadence = require('cadence')

    var queue = []

    function Connection () {
        this.queue = queue
    }

    cadence(function (async) {
        async(function () {
            destructible.monitor('client', Client, Connection, async())
        }, function (client) {
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
        })
    })(destructible.monitor('test'))
}
