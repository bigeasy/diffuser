require('proof')(1, prove)

function prove (okay) {
    var Counter = require('../counter')
    var arrivals = []
    var counter = new Counter({
        set: function (hashed, address) {
            arrivals.push({ hashed: hashed, address: address })
        }
    }, 2)

    counter.arrived({
        address: '2/0', identifiers: [ 0, 1 ]
    })
    counter.arrived({
        address: '2/0', identifiers: [ 0, 1 ]
    })
    counter.arrived({
        address: '3/0', identifiers: [ 2 ]
    })
    okay(arrivals, [{
        hashed: { hash: 890022063, stringified: '0', key: 0 },
        address: '2/0'
    }, {
        hashed: { hash: 873244444, stringified: '1', key: 1 },
        address: '2/0'
    }, {
        hashed: { hash: 923577301, stringified: '2', key: 2 },
        address: '3/0'
    }], 'arrivals')
}
