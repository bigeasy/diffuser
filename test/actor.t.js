require('proof')(2, prove)

function prove (okay, callback) {
    var Destructible = require('destructible')
    var destructible = new Destructible('t/actor.t')

    destructible.completed.wait(callback)

    var cadence = require('cadence')
    cadence(function (async) {
        var connector = []
        var Actor = require('../actor')
        async(function () {
            destructible.durable('actor', Actor, function (body, callback) {
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
            actor.setRouter({ promise: '1/0' })
            actor.act(connector, {
                hashed: { hash: 1, stringified: '1', key: 1 },
                from: '1/0',
                cookie: 0,
                body: 0,
                context: null
            })
            actor.act(connector, {
                hashed: {},
                from: '1/0',
                cookie: 1,
                body: 1,
                context: null
            })
            actor.act(connector, {
                hashed: {},
                from: '1/0',
                cookie: 1,
                body: 2,
                context: null
            })
            setTimeout(async(), 50)
        }, function () {
            okay(connector, [{
                promise: '1/0',
                module: 'diffuser',
                destination: 'source',
                method: 'respond',
                hashed: { hash: 1, stringified: '1', key: 1 },
                cookie: 0,
                from: '1/0',
                to: '1/0',
                status: 'received',
                values: [ 'a' ],
                context: null
            }, {
                promise: '1/0',
                module: 'diffuser',
                destination: 'source',
                method: 'respond',
                hashed: {},
                cookie: 1,
                from: '1/0',
                to: '1/0',
                status: 'received',
                values: [ 'b' ],
                context: null
            }, {
                promise: '1/0',
                module: 'diffuser',
                destination: 'source',
                method: 'respond',
                hashed: {},
                cookie: 1,
                from: '1/0',
                to: '1/0',
                status: 'error',
                values: [ 'c' ],
                context: null
            }], 'actor')
        }, function () {
            destructible.durable('actor', Actor, true, async())
        }, function (actor) {
            actor.setRouter({ promise: '1/0' })
            connector.length = 0
            actor.act(connector, {
                hashed: {},
                from: '1/0',
                cookie: 1,
                body: 2,
                context: null
            })
            setTimeout(async(), 50)
        }, function () {
            okay(connector, [{
                promise: '1/0',
                module: 'diffuser',
                destination: 'source',
                method: 'respond',
                hashed: {},
                cookie: 1,
                from: '1/0',
                to: '1/0',
                status: 'received',
                values: [ null ],
                context: null
            }], 'noop')
        })
    })(destructible.durable('test'))
}
