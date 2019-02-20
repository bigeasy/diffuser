require('proof')(1, prove)

function prove (okay) {
    var queue = []
    var Participant = require('../participant')
    var participant = new Participant({
        identifier: '1',
        instance: 1,
        reactor: function () {},
        queue: queue
    })

    participant.setTable({
        redundancy: 2,
        addresses: [ '1/0', '2/0' ],
        buckets: [ '2/0', '2/0', '1/0', '1/0' ]
    })

    participant.submit({ hash: 2, stringified: '2' }, '1', { a: 1 })

    okay(participant.queue.shift(), {
        module: 'diffuser',
        method: 'submit',
        key: '["1",1,0]',
        addresses: [ '1/0', '2/0' ],
        body: {
            hashed: { hash: 2, stringified: '2' },
            message: { a: 1 }
        }
    }, 'submit')
}
