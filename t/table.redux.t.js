require('proof')(1, prove)

function prove (okay) {
    var Table = require('../table.redux')
    var table = new Table(3)

    var shifter = table.events.shifter()

    table.bootstrap('1/0')

    table.arrive('1/0')

    okay(shifter.shift(), {
        module: 'diffuser',
        method: 'balance',
        addresses: [ '1/0' ],
        buckets: [ '1/0' ]
    }, 'bootstrap')
}
