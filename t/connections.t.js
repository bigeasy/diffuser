require('proof')(8, prove)

function prove (okay) {
    var Connections = require('../connections')
    var expect = [{
        to: { promise: '1/0', index: 2 },
        message: 'first'
    }]
    var connections = new Connections(function (to) {
        var expected = expect.shift()
        okay(to, expected.to, expected.message)
        return { to: to }
    })
    okay(connections.promises(), [], 'no promises')
    connections.remove({ promise: '1/0', index: 0 })
    okay(connections.list('1/0'), [], 'no connections for promise')
    var missing = connections.get({ promise: '1/0', index: 2 })
    okay(missing, null, 'promise missing')
    connections.put({ promise: '1/0', index: 2 }, { to: { promise: '1/0', index: 2 } })
    var missing = connections.get({ promise: '1/0', index: 1 })
    okay(missing, null, 'index missing')
    connections.put({ promise: '1/0', index: 1 }, { to: { promise: '1/0', index: 2 } })
    var first = connections.get({ promise: '1/0', index: 2 })
    okay(first === connections.get({ promise: '1/0', index: 2 }), 'got same')
    okay(connections.list('1/0').map(function (connection) { return connection.to }), [{
        promise: '1/0', index: 2
    }, {
        promise: '1/0', index: 2
    }], 'list')
    okay(connections.promises(), [ '1/0' ], 'promises')
    connections.remove({ promise: '2/0', index: 0 })
    connections.remove({ promise: '1/0', index: 0 })
    connections.remove({ promise: '1/0', index: 1 })
    connections.remove({ promise: '1/0', index: 2 })
    okay(connections.promises(), [], 'promises gone')
}
