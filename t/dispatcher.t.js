require('proof')(1, prove)

function prove (okay) {
    var Dispatcher = require('../dispatcher')
    var dispatcher = new Dispatcher({ index: 1, buckets: 7 })
    dispatcher.setRoutes({
        event: { action: 'arrive', promise: '1/0' },
        self: '1/0',
        promise: '1/0',
        properties: { '1/0': { count: 2 } },
        buckets: [ '1/0', '1/0', '1/0', '1/0', '1/0', '1/0', '1/0' ]
    })
    dispatcher.dispatch({
        module: 'diffuser',
        promise: '1/0',
        destination: 'router',
        method: 'synchronize',
        to: { promise: '1/0', index: 1 },
        from: { promise: '1/0', index: 1 },
        body: null
    })
    dispatcher.dispatch({
        module: 'diffuser',
        promise: '1/0',
        destination: 'router',
        method: 'synchronize',
        to: { promise: '1/0', index: 1 },
        from: { promise: '1/0', index: 0 },
        body: null
    })
    okay(true, 'okay')
}
