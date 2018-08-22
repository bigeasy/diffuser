require('proof')(1, prove)

function prove (okay) {
    var client = []
    var Actor = require('../actor')
    var actor = new Actor(function (body) {
        switch (body) {
        case 0:
            return {
                method: 'respond',
                body: 'a'
            }
        case 1:
            return {
                method: 'request',
                body: 'b',
                key: 'b'
            }
        }
    })
    actor.act(client, {
        gatherer: 'udp://127.0.0.1:8514/1/1',
        hashed: { hash: 1, stringified: '1', key: 1 },
        from: '1/0',
        body: 0
    })
    actor.act(client, {
        gatherer: 'udp://127.0.0.1:8514/1/2',
        from: '1/0',
        body: 1
    })
    actor.act(client, {
        body: 2
    })
    okay(client, [{
        gatherer: 'udp://127.0.0.1:8514/1/1',
        type: 'response',
        hashed: { hash: 1, stringified: '1', key: 1 },
        from: '1/0',
        to: '1/0',
        body: 'a'
    }, {
        gatherer: 'udp://127.0.0.1:8514/1/2',
        type: 'request',
        from: '1/0',
        key: 'b',
        body: 'b'
    }], 'actor')
}
