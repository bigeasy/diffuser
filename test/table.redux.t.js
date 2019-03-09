require('proof')(7, prove)

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
            departed: [],
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
            departed: [],
            buckets: [ '1/0' ],
            pending: {
                version: '2',
                addresses: [ '1/0', '2/0' ],
                departed: [],
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
            departed: [],
            buckets: [ '2/0', '2/0', '1/0', '1/0' ],
            redundancy: 2
        }
    }, 'complete')

    table.arrive('1/0', '3/0')

    table.arrive('1/0', '4/0')

    okay(shifter.shift(), {
        module: 'diffuser',
        method: 'receive',
        version: '3'
    }, 'arrive 3/0')

    table.received('3')

    okay(shifter.shift(), {
        module: 'diffuser',
        method: 'balance',
        table: {
            version: '2',
            addresses: [ '1/0', '2/0' ],
            departed: [],
            buckets: [ '2/0', '2/0', '1/0', '1/0' ],
            redundancy: 2,
            pending: {
                version: '3',
                buckets: [ '3/0', '2/0', '3/0', '1/0', '2/0', '2/0', '1/0', '1/0' ],
                addresses: [ '1/0', '2/0', '3/0' ],
                departed: [],
                redundancy: 3
            }
        }
    }, 'received 3/0')

    // An entry departed while its arrival was pending.
    table.depart('1/0', '3/0')

    // An entry departed while it was still queued for arrival.
    // table.depart('1/0', '4/0')

    okay(shifter.shift(), {
        module: 'diffuser',
        method: 'depart',
        table: {
            version: '2',
            addresses: [ '1/0', '2/0' ],
            departed: [],
            buckets: [ '2/0', '2/0', '1/0', '1/0' ],
            redundancy: 2,
            pending: null
        }
    }, 'depart 3/0')
}
