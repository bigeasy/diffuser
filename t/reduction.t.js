require('proof')(2, prove)

function prove (okay) {
    var Reduction = require('../reduction')
    var reduction = new Reduction

    reduction.operation('2', [ '1/0', '2/0' ])

    okay(!reduction.complete('2', '1/0'), 'incomplete')
    okay(reduction.complete('2', '2/0'), 'complete')
}
