require('proof')(8, prove)

function prove (okay) {
    var Addresser = require('../addresser')
    var expect = [{
        to: { promise: '1/0', index: 2 },
        message: 'first'
    }]
    var addresser = new Addresser(function (to) {
        var expected = expect.shift()
        okay(to, expected.to, expected.message)
        return { to: to }
    })
    okay(addresser.promises(), [], 'no promises')
    addresser.remove({ promise: '1/0', index: 0 })
    okay(addresser.list('1/0'), [], 'no connections for promise')
    var missing = addresser.get({ promise: '1/0', index: 2 })
    okay(missing, null, 'promise missing')
    addresser.put({ promise: '1/0', index: 2 }, { to: { promise: '1/0', index: 2 } })
    var missing = addresser.get({ promise: '1/0', index: 1 })
    okay(missing, null, 'index missing')
    addresser.put({ promise: '1/0', index: 1 }, { to: { promise: '1/0', index: 2 } })
    var first = addresser.get({ promise: '1/0', index: 2 })
    okay(first === addresser.get({ promise: '1/0', index: 2 }), 'got same')
    okay(addresser.list('1/0').map(function (connection) { return connection.to }), [{
        promise: '1/0', index: 2
    }, {
        promise: '1/0', index: 2
    }], 'list')
    okay(addresser.promises(), [ '1/0' ], 'promises')
    addresser.remove({ promise: '2/0', index: 0 })
    addresser.remove({ promise: '1/0', index: 0 })
    addresser.remove({ promise: '1/0', index: 1 })
    addresser.remove({ promise: '1/0', index: 2 })
    okay(addresser.promises(), [], 'promises gone')
}
