require('proof')(1, prove)

function prove (okay, callback) {
    function Hash (value) { return { hash: value, stringified: String(value) } }
    var Destructible = require('destructible')
    var destructible = new Destructible('t/synchronizer.t')
    destructible.completed.wait(callback)
    var Synchronizer = require('../synchronizer')
    var client = []
    var synchronizer = new Synchronizer(destructible, client, 7)
    synchronizer.register(Hash(1))
    okay(synchronizer.contains(Hash(1)), 'contains')
    synchronizer.synchronize({ promise: '1/0', index: 2 }, client, {
        event: { action: 'arrive', promise: '2/0' },
        buckets: [ '2/0', '2/0', '2/0', '1/0', '1/0', '1/0', '1/0' ],
        properties: { '1/0': { count: 3 }, '2/0': { count: 3 } }
    })
    destructible.destroy()
}
