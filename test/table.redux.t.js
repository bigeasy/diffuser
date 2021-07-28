require('proof')(10, prove)

function prove (okay) {
    const hash = require('../hash')

    var Table = require('../table.redux')
    const tables = [ new Table(2) ]

    var shifter = tables[0].events.shifter().sync

    // Bootstrap will simply be an arrival occuring before a snapshot is set. We
    // can assert that the arrival is `"1/0"`.
    {
        okay(! tables[0].active, 'active created')
        okay(tables[0].version, 0n, 'version created')

        const version = tables[0].arrive('1/0', '1/0')

        okay(version, 1n, 'first version')

        okay(! tables[0].active, 'active not completed')
        okay(tables[0].version, 0n, 'version not completed')

        tables[0].complete(1n)

        okay(tables[0].lookup(hash('x')), '1/0', 'bootstrap lookup')

        okay(tables[0].version, 1n, 'version')

        okay(tables[0].where(tables[0].version, 'x'), [], 'find missing')

        tables[0].set(hash('x'), 'x', '1/0')

        okay(tables[0].where(tables[0].version, 'x'), [ '1/0' ], 'find missing')
    }

    {
        tables[0].arrive('1/0', '2/0')
        okay(tables[0].tables, [{
            version: '1',
            type: 'arrival',
            where: { x: [ '1/0' ] },
            addresses: [ '1/0' ],
            buckets: [ '1/0' ],
            departed: []
        }, {
            version: '2',
            type: 'arrival',
            where: {},
            addresses: [ '1/0', '2/0' ],
            buckets: [ '2/0', '2/0', '1/0', '1/0' ],
            departed: []
        }], 'pending table')
        tables.push(new Table(2))
        tables[0].snapshot(1n)
    }

    return

    table.has('1/0', 100)

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
