require('proof')(4, prove)

function prove (okay) {
    var Table = require('../table.redux')
    var table = new Table(3, 2)

    var shifter = table.events.shifter()

    table.bootstrap()

    table.arrive('1/0', '1/0')

    okay(shifter.shift(), {
        module: 'diffuser',
        method: 'bootstrap',
        table: {
            version: '1',
            addresses: [ '1/0' ],
            buckets: [ '1/0' ],
            redundancy: 1
        }
    }, 'bootstrap')

    table.arrive('1/0', '2/0')

    okay(shifter.shift(), {
        module: 'diffuser',
        method: 'receive',
        version: '2'
    }, 'balance')

    table.received('2')

    okay(shifter.shift(), {
        module: 'diffuser',
        method: 'balance',
        table: {
            version: '1',
            redundancy: 1,
            addresses: [ '1/0' ],
            buckets: [ '1/0' ],
            pending: {
                version: '2',
                addresses: [ '1/0', '2/0' ],
                buckets: [ '2/0', '2/0', '1/0', '1/0' ],
                redundancy: 2
            }
        }
    }, 'balance')

    table.complete('2')

    okay(shifter.shift(), {
        module: 'diffuser',
        method: 'complete',
        table: {
            version: '2',
            addresses: [ '1/0', '2/0' ],
            buckets: [ '2/0', '2/0', '1/0', '1/0' ],
            redundancy: 2
        }
    }, 'complete')
}
