require('proof')(1, prove)

function prove (okay, callback) {
    var Destructible = require('destructible')
    var destructible = new Destructible('t/actor.t')
    var client = []
    var Actor = require('../actor')
    var actor = new Actor(destructible, function (body, callback) {
        switch (body) {
        case 0:
            callback(null, 'a')
            break
        case 1:
            callback(null, 'b')
            break
        }
    })
    destructible.completed.wait(callback)
    actor.act(client, {
        gatherer: 'udp://127.0.0.1:8514/1/1',
        hashed: { hash: 1, stringified: '1', key: 1 },
        from: '1/0',
        cookie: 0,
        body: 0
    })
    actor.act(client, {
        gatherer: 'udp://127.0.0.1:8514/1/2',
        hashed: {},
        from: '1/0',
        cookie: 1,
        body: 1
    })
    okay(client, [{
        gatherer: 'udp://127.0.0.1:8514/1/1',
        hashed: { hash: 1, stringified: '1', key: 1 },
        method: 'respond',
        destination: 'source',
        cookie: 0,
        from: '1/0',
        to: '1/0',
        status: 'received',
        values: [ 'a' ]
    }, {
        gatherer: 'udp://127.0.0.1:8514/1/2',
        method: 'respond',
        destination: 'source',
        hashed: {},
        cookie: 1,
        from: '1/0',
        to: '1/0',
        status: 'received',
        values: [ 'b' ]
    }], 'actor')
    destructible.destroy()
}
