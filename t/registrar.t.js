require('proof')(3, prove)

function prove (okay) {
    function Hash (value) { return { hash: value, stringified: String(value) } }
    var Registrar = require('../registrar')
    var client = []
    var registrar = new Registrar({
        client: client,
        index: 2,
        buckets: 7
    })
    registrar.setRoutes({
        promise: '2/0',
        self: '1/0',
        event: { action: 'arrive', promise: '2/0' },
        buckets: [ '2/0', '2/0', '2/0', '1/0', '1/0', '1/0', '1/0' ],
        properties: { '1/0': { count: 2 }, '2/0': { count: 2 } }
    })
    registrar.register(Hash(1))
    okay(registrar.contains(Hash(1)), 'contains')
    registrar.synchronize()
    var sent = [{
        module: 'diffuser',
        method: 'synchronize',
        from: { promise: '1/0', index: 2 },
        to: { promise: '2/0', index: 1 },
        promise: '2/0',
        body: { hash: 1, stringified: '1' }
    }, {
        module: 'diffuser',
        method: 'synchronize',
        from: { promise: '1/0', index: 2 },
        to: { promise: '1/0', index: 2 },
        promise: '2/0',
        body: null
    }, {
        module: 'diffuser',
        method: 'synchronize',
        from: { promise: '1/0', index: 2 },
        to: { promise: '1/0', index: 2 },
        promise: '2/0',
        body: null
    }, {
        module: 'diffuser',
        method: 'synchronize',
        from: { promise: '1/0', index: 2 },
        to: { promise: '2/0', index: 2 },
        promise: '2/0',
        body: null
    }, {
        module: 'diffuser',
        method: 'synchronize',
        from: { promise: '1/0', index: 2 },
        to: { promise: '2/0', index: 2 },
        promise: '2/0',
        body: null
    }]
    okay(client, sent, 'arrive')
    registrar.unregister(Hash(1))
    registrar.register(Hash(5))
    client.length = 0
    sent[0] = {
        module: 'diffuser',
        method: 'synchronize',
        from: { promise: '1/0', index: 2 },
        to: { promise: '1/0', index: 1 },
        promise: '2/0',
        body: { hash: 5, stringified: '5' }
    }
    registrar.setRoutes({
        event: { action: 'depart', promise: '2/0' },
        promise: '2/0',
        self: '1/0',
        buckets: [ '2/0', '2/0', '2/0', '1/0', '1/0', '1/0', '1/0' ],
        properties: { '1/0': { count: 2 }, '2/0': { count: 2 } }
    })
    registrar.synchronize()
    okay(client, sent, 'depart')
}
