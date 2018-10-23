require('proof')(2, prove)

function prove (okay, callback) {
    var Destructible = require('destructible')
    var destructible = new Destructible('t/actor.t')

    destructible.completed.wait(callback)

    var cadence = require('cadence')
    cadence(function (async) {
        var client = []
        var Actor = require('../actor')
        async(function () {
            destructible.monitor('actor', Actor, function (body, callback) {
                switch (body) {
                case 0:
                    callback(null, 'a')
                    break
                case 1:
                    callback(null, 'b')
                    break
                case 2:
                    callback(new Error('c'))
                    break
                }
            }, async())
        }, function (actor) {
            actor.act(client, {
                hashed: { hash: 1, stringified: '1', key: 1 },
                from: '1/0',
                cookie: 0,
                body: 0
            })
            actor.act(client, {
                hashed: {},
                from: '1/0',
                cookie: 1,
                body: 1
            })
            actor.act(client, {
                hashed: {},
                from: '1/0',
                cookie: 1,
                body: 2
            })
            setTimeout(async(), 50)
        }, function () {
            okay(client, [{
                hashed: { hash: 1, stringified: '1', key: 1 },
                method: 'respond',
                destination: 'source',
                cookie: 0,
                from: '1/0',
                to: '1/0',
                status: 'received',
                values: [ 'a' ]
            }, {
                method: 'respond',
                destination: 'source',
                hashed: {},
                cookie: 1,
                from: '1/0',
                to: '1/0',
                status: 'received',
                values: [ 'b' ]
            }, {
                method: 'respond',
                destination: 'source',
                hashed: {},
                cookie: 1,
                from: '1/0',
                to: '1/0',
                status: 'error',
                values: [ 'c' ]
            }], 'actor')
        }, function () {
            destructible.monitor('actor', Actor, true, async())
        }, function (actor) {
            client.length = 0
            actor.act(client, {
                hashed: {},
                from: '1/0',
                cookie: 1,
                body: 2
            })
            setTimeout(async(), 50)
        }, function () {
            okay(client, [{
                method: 'respond',
                destination: 'source',
                hashed: {},
                cookie: 1,
                from: '1/0',
                to: '1/0',
                status: 'received',
                values: [ null ]
            }], 'noop')
        })
    })(destructible.monitor('test'))
}
