require('proof')(4, prove)

function prove (okay) {
    var Table = require('../table')
    var table = new Table
    table.bootstrap(7)
    table.arrive('1/0')
    okay({
        addresses: table.addresses,
        buckets: table.buckets
    }, {
        addresses: [ '1/0' ],
        buckets: [ '1/0', '1/0', '1/0', '1/0', '1/0', '1/0', '1/0' ]
    }, 'join')
    table.join(table.addresses, table.buckets)
    table.arrive('2/0')
    okay({
        addresses: table.addresses,
        buckets: table.buckets
    }, {
        addresses: [ '1/0', '2/0' ],
        buckets: [ '2/0', '2/0', '2/0', '2/0', '1/0', '1/0', '1/0' ]
    }, 'first arrival')
    table.arrive('3/0')
    okay({
        addresses: table.addresses,
        buckets: table.buckets
    }, {
        addresses: [ '1/0', '2/0', '3/0' ],
        buckets: [ '3/0', '2/0', '2/0', '2/0', '3/0', '3/0', '1/0' ]
    }, 'second arrival')
    table.depart('2/0')
    okay({
        addresses: table.addresses,
        buckets: table.buckets
    }, {
        addresses: [ '1/0', '3/0' ],
        buckets: [ '3/0', '1/0', '3/0', '1/0', '3/0', '3/0', '1/0' ]
    }, 'second arrival')
}
