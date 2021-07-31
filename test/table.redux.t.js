require('proof')(13, prove)

function prove (okay) {
    const hash = require('../hash')

    var Table = require('../table.redux')
    const tables = [ new Table(2) ]

    // Bootstrap will simply be an arrival occuring before a snapshot is set. We
    // can assert that the arrival is `"1/0"`.
    {
        okay(! tables[0].active, 'active created')
        okay(tables[0].version, '0/0', 'version created')

        const version = tables[0].arrive('1/0', '1/0')

        okay(version, '1/0', 'first version')

        okay(! tables[0].active, 'active not completed')
        okay(tables[0].version, '0/0', 'version not completed')

        tables[0].complete('1/0')

        okay(tables[0].lookup(hash('x')), '1/0', 'bootstrap lookup')

        okay(tables[0].version, '1/0', 'version')

        okay(tables[0].get(tables[0].version, 'x'), [], 'find missing')

        okay(tables[0].get('0/0', 'x'), null, 'version missing')

        tables[0].set(hash('x'), 'x', '1/0')

        okay(tables[0].get(tables[0].version, 'x'), [ '1/0' ], 'find missing')
    }

    {
        tables[0].arrive('1/0', '2/0')
        okay(tables[0].tables, [{
            version: '1/0',
            previous: '0/0',
            type: 'arrival',
            where: { x: [ '1/0' ] },
            addresses: [ '1/0' ],
            buckets: [ '1/0' ],
            departed: []
        }, {
            version: '2/0',
            previous: '1/0',
            type: 'arrival',
            where: {},
            addresses: [ '1/0', '2/0' ],
            buckets: [ '2/0', '2/0', '1/0', '1/0' ],
            departed: []
        }], 'pending table')

        // Test a snapshot and join.
        tables.push(new Table(2))
        tables[1].join(tables[0].snapshot('2/0'))
        tables[1].arrive('2/0', '2/0')

        const inspections = [ tables[0].tables, tables[1].tables ]

        inspections[0][0].where = {}
        okay(inspections[1], inspections[0], 'join matches')


        tables[0].set(hash('x'), 'x', '1/0')
        tables[0].set(hash('y'), 'y', '1/0')
        tables[0].set(hash('z'), 'z', '1/0')

        okay(tables[0].tables, [
          {
            version: '1/0',
            previous: '0/0',
            type: 'arrival',
            where: { x: [ '1/0' ], y: [ '1/0' ], z: [ '1/0' ] },
            addresses: [ '1/0' ],
            buckets: [ '1/0' ],
            departed: []
          },
          {
            version: '2/0',
            previous: '1/0',
            type: 'arrival',
            where: { x: [ '1/0' ], y: [ '1/0' ] },
            addresses: [ '1/0', '2/0' ],
            buckets: [ '2/0', '2/0', '1/0', '1/0' ],
            departed: []
          }
        ], 'spread over multiple versions')

        tables[0].complete('2/0')
        tables[1].complete('2/0')
    }

    {
        tables[0].arrive('1/0', '3/0')
        tables[0].complete('3/0')

        tables[0].depart('4/0', '3/0')
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
