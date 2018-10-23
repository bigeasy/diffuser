require('proof')(1, prove)

function prove (okay) {
    function Hash (value) { return { hash: value, stringified: String(value) } }
    var Registrar = require('../registrar')
    var client = []
    var registrar = new Registrar(destructible, client, 7)
    registrar.register(Hash(1))
    okay(registrar.contains(Hash(1)), 'contains')
    registrar.synchronize({ promise: '1/0', index: 2 }, client, {
        event: { action: 'arrive', promise: '2/0' },
        buckets: [ '2/0', '2/0', '2/0', '1/0', '1/0', '1/0', '1/0' ],
        properties: { '1/0': { count: 3 }, '2/0': { count: 3 } }
    })
}
