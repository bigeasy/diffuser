require('proof')(2, prove)

function prove (okay) {
    var Table = require('../table.redux')
    var table = new Table(3, 1)

    var shifter = table.events.shifter()

    table.bootstrap()

    table.arrive('1/0', '1/0')

    okay(shifter.shift(), {
        module: 'diffuser',
        method: 'bootstrap',
        promise: '1/0',
        version: '1',
        addresses: [ '1/0' ],
        buckets: [ '1/0' ],
        redundancy: 1
    }, 'bootstrap')

    table.arrive('1/0', '2/0')

    okay(shifter.shift(), {
        module: 'diffuser',
        method: 'balance',
        promise: '2/0',
        version: '2',
        addresses: [ '1/0', '2/0' ],
        buckets: [ '1/0' ],
        balanced: [ '2/0', '2/0', '1/0', '1/0' ],
        redundancy: 2
    }, 'balance')
}
