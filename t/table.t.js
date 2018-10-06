require('proof')(5, prove)

function prove (okay) {
    var Table = require('../table')
    var table = new Table
    table.bootstrap('1/0', 7)
    table.arrive('1/0', { isRouter: true })
    okay({
        addresses: table.addresses,
        buckets: table.buckets
    }, {
        addresses: [ '1/0' ],
        buckets: [ '1/0', '1/0', '1/0', '1/0', '1/0', '1/0', '1/0' ]
    }, 'join')
    table.join('1/0', table.getSnapshot())
    table.arrive('2/0', { isRouter: true })
    okay({
        addresses: table.addresses,
        buckets: table.buckets
    }, {
        addresses: [ '1/0', '2/0' ],
        buckets: [ '2/0', '2/0', '2/0', '2/0', '1/0', '1/0', '1/0' ]
    }, 'first arrival')
    table.arrive('3/0', { isRouter: true })
    okay({
        addresses: table.addresses,
        buckets: table.buckets
    }, {
        addresses: [ '1/0', '2/0', '3/0' ],
        buckets: [ '3/0', '2/0', '2/0', '2/0', '3/0', '3/0', '1/0' ]
    }, 'second arrival')
    table.arrive('4/0', { isRouter: false })
    okay(table.getSnapshot(), {
        self: '1/0',
        properties: {
            '1/0': { isRouter: true },
            '2/0': { isRouter: true },
            '3/0': { isRouter: true },
            '4/0': { isRouter: false }
        },
        addresses: [ '1/0', '2/0', '3/0' ],
        buckets: [ '3/0', '2/0', '2/0', '2/0', '3/0', '3/0', '1/0' ]
    }, 'non-router arrival')
    table.depart('4/0')
    table.depart('2/0')
    okay({
        addresses: table.addresses,
        buckets: table.buckets
    }, {
        addresses: [ '1/0', '3/0' ],
        buckets: [ '3/0', '1/0', '3/0', '1/0', '3/0', '3/0', '1/0' ]
    }, 'departure')
}
