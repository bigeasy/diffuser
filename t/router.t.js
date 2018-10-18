require('proof')(4, prove)

function prove (okay) {
    var Acceptor = require('prolific.acceptor')
    var sink = require('prolific.sink')
    var log = sink.queue = []
    sink.acceptor = new Acceptor(true, [])
    var hashes = ([ 0, 1, 2, 3 ]).map(function (value) {
        return { hash: value, stringified: String(value), key: value }
    })
    var client = []
    client.hostname = 'x'
    var Hash = require('../hash')
    var actor = {
        act: function (client, envelope) {
            okay(envelope, {
                gatherer: 'udp://127.0.0.1:8514/1/5',
                from: { promise: '1/0', index: 0 },
                to: '1/0',
                hashed: { hash: 0, stringified: '0', key: 0 },
                destination: 'router',
                method: 'request',
                body: 1
            }, 'acted')
        }
    }
    var Router = require('../router')
    var router = new Router(actor, client, { promise: '1/0', index: 0 })
    router.push({ hashed: hashes[0], body: 0 })
    router.setRoutes('1/0', [ '1/0', '2/0', '1/0', '1/0', '2/0', '2/0', '1/0' ], { '1/0': 1, '2/0': 1 })
    router.locate(hashes[0], '4/0')
    router.locate(hashes[1], '4/0')
    router.push({
        destination: 'sink',
        hashed: hashes[0],
        gatherer: 'udp://127.0.0.1:8514/1/1',
        cookie: 1,
        from: { promise: '1/0', index: 0 },
        body: 0
    })
    router.push({
        destination: 'sink',
        method: 'receive',
        hashed: hashes[1],
        gatherer: 'udp://127.0.0.1:8514/1/3',
        from: { promise: '1/0', index: 0 },
        body: 1
    })
    router.push({
        destination: 'sink',
        method: 'receive',
        hashed: hashes[2],
        gatherer: 'udp://127.0.0.1:8514/1/4',
        from: { promise: '1/0', index: 0 },
        body: 2
    })
    router.push({
        destination: 'sink',
        method: 'receive',
        hashed: hashes[3],
        gatherer: 'udp://127.0.0.1:8514/1/2',
        from: { promise: '1/0', index: 0 },
        body: 3
    })
    okay(client.splice(0), [{
        destination: 'sink',
        method: 'receive',
        promise: '1/0',
        gatherer: 'udp://127.0.0.1:8514/1/3',
        from: { promise: '1/0', index: 0 },
        to: { promise: '2/0', index: 0 },
        hashed: { hash: 1, stringified: '1', key: 1 },
        body: 1
    }], 'empty')
    router.setRoutes('1/0', [ '1/0', '2/0', '3/0', '1/0', '2/0', '2/0', '1/0' ], { '1/0': 1, '2/0': 1, '3/0': 1 })
    router.ready()
    router.push({
        gatherer: 'udp://127.0.0.1:8514/1/5',
        from: { promise: '1/0', index: 0 },
        to: '1/0',
        hashed: { hash: 0, stringified: '0', key: 0 },
        destination: 'router',
        method: 'request',
        body: 1
    })
    okay(log.map(function (entry) {
        return entry.json.qualified
    }), [
        'diffuser#dropped', 'diffuser#rerouted', 'diffuser#rerouted', 'diffuser#forwarded', 'diffuser#missing'
    ], 'logging')
    okay(client.slice(), [{
        destination: 'sink',
        promise: '1/0',
        gatherer: 'udp://127.0.0.1:8514/1/4',
        method: 'receive',
        from: { promise: '1/0', index: 0 },
        to: { promise: '3/0', index: 0 },
        hashed: { hash: 2, stringified: '2', key: 2 },
        body: 2
    }, {
        gatherer: 'udp://127.0.0.1:8514/1/1',
        method: 'receive',
        cookie: 1,
        from: { promise: '1/0', index: 0 },
        to: '4/0',
        hashed: { hash: 0, stringified: '0', key: 0 },
        body: 0
    }, {
        destination: 'source',
        gatherer: 'udp://127.0.0.1:8514/1/2',
        method: 'response',
        from: { promise: '1/0', index: 0 },
        to: { promise: '1/0', index: 0 },
        body: { statusCode: 404 }
    }], 'routed')
}
