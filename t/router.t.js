require('proof')(3, prove)

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
    var Router = require('../router')
    var router = new Router(client, 'a')
    router.push({ hashed: hashes[0], body: 0 })
    router.setBuckets([ 'a', 'b', 'a', 'a', 'b', 'b', 'a' ])
    router.locate(hashes[0], '2/0')
    router.locate(hashes[1], '2/0')
    router.push({
        hashed: hashes[0],
        gatherer: 'udp://127.0.0.1:8514/1/1',
        from: '1/0',
        body: 0
    })
    router.push({ hashed: hashes[1], body: 1 })
    router.push({ hashed: hashes[2], body: 2 })
    router.push({
        hashed: hashes[3],
        gatherer: 'udp://127.0.0.1:8514/1/2',
        from: '1/0',
        body: 3
    })
    okay(client.slice(), [], 'empty')
    router.setBuckets([ 'a', 'b', 'c', 'a', 'b', 'b', 'a' ])
    router.ready()
    okay(log.map(function (entry) {
        return entry.json.qualified
    }), [
        'diffuser#dropped', 'diffuser#dropped', 'diffuser#forwarded', 'diffuser#missing'
    ], 'logging')
    okay(client.slice(), [{
        gatherer: 'udp://127.0.0.1:8514/1/1',
        type: 'request',
        from: '1/0',
        to: '2/0',
        hashed: { hash: 0, stringified: '0', key: 0 },
        body: 0
    }, {
        gatherer: 'udp://127.0.0.1:8514/1/2',
        type: 'response',
        from: '1/0',
        to: '1/0',
        body: { statusCode: 404 }
    }], 'routed')
}
