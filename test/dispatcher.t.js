require('proof')(12, prove)

function prove (okay) {
    var Dispatcher = require('../dispatcher')
    var Cliffhanger = require('cliffhanger')
    var cliffhanger = new Cliffhanger
    var actions = []
    var connector = []
    var dispatcher = new Dispatcher({
        index: 0,
        buckets: 7,
        visitor: {
            setRouter: function () {},
            act: function (client, envelope) { actions.push(envelope) }
        },
        receiver: {
            setRouter: function () {},
            act: function (client, envelope) { actions.push(envelope) }
        },
        connector: connector,
        cliffhanger: cliffhanger,
        registrar: {
            contains: function (hashed) { return hashed.hash == 1 }
        }
    })
    dispatcher.setRoutes({
        event: { action: 'arrive', promise: '1/0' },
        self: '1/0',
        promise: '1/0',
        properties: { '1/0': { count: 1 } },
        buckets: [ '1/0', '1/0', '1/0', '1/0', '1/0', '1/0', '1/0' ]
    })
    dispatcher.dispatch({
        module: 'diffuser',
        promise: '1/0',
        destination: 'router',
        method: 'synchronize',
        to: { promise: '1/0', index: 0 },
        from: { promise: '1/0', index: 0 },
        body: null
    })
    dispatcher.dispatch({
        module: 'diffuser',
        promise: '2/0',
        destination: 'router',
        method: 'synchronize',
        to: { promise: '1/0', index: 0 },
        from: { promise: '2/0', index: 0 },
        body: null
    })
    dispatcher.dispatch({
        module: 'diffuser',
        promise: '2/0',
        destination: 'router',
        method: 'receive',
        to: { promise: '1/0', index: 0 },
        from: { promise: '2/0', index: 0 },
        hashed: { hash: 2, stringified: '2' },
        body: null
    })
    dispatcher.setRoutes({
        event: { action: 'arrive', promise: '2/0' },
        self: '1/0',
        promise: '2/0',
        properties: { '1/0': { count: 1 }, '2/0': { count: 1 } },
        buckets: [ '1/0', '1/0', '1/0', '2/0', '2/0', '2/0', '2/0' ]
    })
    dispatcher.dispatch({
        module: 'diffuser',
        promise: '2/0',
        destination: 'router',
        method: 'receive',
        to: { promise: '1/0', index: 0 },
        from: { promise: '2/0', index: 0 },
        hashed: { hash: 2, stringified: '2' },
        body: null
    })
    dispatcher.dispatch({
        module: 'diffuser',
        promise: '2/0',
        destination: 'router',
        method: 'synchronize',
        to: { promise: '1/0', index: 0 },
        from: { promise: '1/0', index: 0 },
        body: { hash: 1, stringified: '1' }
    })
    dispatcher.dispatch({
        module: 'diffuser',
        promise: '2/0',
        destination: 'router',
        method: 'synchronize',
        to: { promise: '1/0', index: 0 },
        from: { promise: '1/0', index: 0 },
        body: { hash: 5, stringified: '5' }
    })
    dispatcher.dispatch({
        module: 'diffuser',
        promise: '2/0',
        destination: 'router',
        method: 'synchronize',
        to: { promise: '1/0', index: 0 },
        from: { promise: '1/0', index: 0 },
        body: null
    })
    okay(actions.splice(0), [{
        module: 'diffuser',
        promise: '2/0',
        destination: 'router',
        method: 'receive',
        to: { promise: '1/0', index: 0 },
        from: { promise: '2/0', index: 0 },
        hashed: { hash: 2, stringified: '2' },
        body: null
    }, {
        module: 'diffuser',
        promise: '2/0',
        destination: 'router',
        method: 'receive',
        to: { promise: '1/0', index: 0 },
        from: { promise: '2/0', index: 0 },
        hashed: { hash: 2, stringified: '2' },
        body: null
    }], 'synchronize')
    dispatcher.dispatch({
        promise: '2/0',
        module: 'diffuser',
        destination: 'router',
        method: 'route',
        hashed: { hash: 5, stringified: '5' },
        to: { promise: '1/0', index: 0 },
        from: { promise: '1/0', index: 0 },
        cookie: '1'
    })
    okay(connector.splice(0), [{
        promise: '2/0',
        module: 'diffuser',
        destination: 'router',
        method: 'route',
        to: { promise: '2/0', index: 0 },
        from: { promise: '1/0', index: 0 },
        hashed: { hash: 5, stringified: '5' },
        cookie: '1'
    }], 'reroute')
    dispatcher.dispatch({
        promise: '2/0',
        module: 'diffuser',
        destination: 'router',
        method: 'unregister',
        hashed: { hash: 0, stringified: '0' },
        to: { promise: '1/0', index: 0 },
        from: { promise: '1/0', index: 0 },
        cookie: '1',
        body: null
    })
    okay(connector.splice(0), [{
        promise: '2/0',
        module: 'diffuser',
        destination: 'source',
        method: 'respond',
        to: { promise: '1/0', index: 0 },
        from: { promise: '1/0', index: 0 },
        hashed: { hash: 0, stringified: '0' },
        status: 'received',
        cookie: '1',
        body: { exists: false, deleted: false }
    }], 'unregister missing')
    dispatcher.dispatch({
        promise: '2/0',
        module: 'diffuser',
        destination: 'router',
        method: 'unregister',
        hashed: { hash: 1, stringified: '1' },
        to: { promise: '1/0', index: 0 },
        from: { promise: '2/0', index: 0 },
        cookie: '1',
        body: null
    })
    okay(connector.splice(0), [{
        promise: '2/0',
        module: 'diffuser',
        destination: 'source',
        method: 'respond',
        to: { promise: '2/0', index: 0 },
        from: { promise: '2/0', index: 0 },
        hashed: { hash: 1, stringified: '1' },
        status: 'received',
        cookie: '1',
        body: { exists: true, deleted: false }
    }], 'wrong source unregister')
    dispatcher.dispatch({
        promise: '2/0',
        module: 'diffuser',
        destination: 'router',
        method: 'unregister',
        hashed: { hash: 1, stringified: '1' },
        to: { promise: '1/0', index: 0 },
        from: { promise: '1/0', index: 0 },
        cookie: '1',
        body: null
    })
    okay(connector.splice(0), [{
        promise: '2/0',
        module: 'diffuser',
        destination: 'source',
        method: 'respond',
        to: { promise: '1/0', index: 0 },
        from: { promise: '1/0', index: 0 },
        hashed: { hash: 1, stringified: '1' },
        status: 'received',
        cookie: '1',
        body: { exists: true, deleted: true }
    }], 'unregister')
    dispatcher.dispatch({
        promise: '2/0',
        module: 'diffuser',
        destination: 'router',
        method: 'register',
        hashed: { hash: 1, stringified: '1' },
        to: { promise: '1/0', index: 0 },
        from: { promise: '1/0', index: 0 },
        cookie: '1',
        body: null
    })
    okay(connector.splice(0), [{
        promise: '2/0',
        module: 'diffuser',
        destination: 'source',
        method: 'respond',
        to: { promise: '1/0', index: 0 },
        from: { promise: '1/0', index: 0 },
        hashed: { hash: 1, stringified: '1' },
        status: 'received',
        cookie: '1'
    }], 'register')
    dispatcher.dispatch({
        promise: '2/0',
        module: 'diffuser',
        destination: 'router',
        method: 'route',
        hashed: { hash: 1, stringified: '1' },
        to: { promise: '1/0', index: 0 },
        from: { promise: '1/0', index: 0 },
        cookie: '1',
        body: {}
    })
    okay(connector.splice(0), [{
        promise: '2/0',
        module: 'diffuser',
        destination: 'receiver',
        method: 'receive',
        to: { promise: '1/0', index: 0 },
        from: { promise: '1/0', index: 0 },
        hashed: { hash: 1, stringified: '1' },
        cookie: '1',
        body: {}
    }], 'route')
    dispatcher.dispatch({
        promise: '2/0',
        module: 'diffuser',
        destination: 'router',
        method: 'route',
        hashed: { hash: 0, stringified: '0' },
        to: { promise: '1/0', index: 0 },
        from: { promise: '1/0', index: 0 },
        cookie: '1'
    })
    okay(connector.splice(0), [{
        promise: '2/0',
        module: 'diffuser',
        destination: 'source',
        method: 'respond',
        to: { promise: '1/0', index: 0 },
        from: { promise: '1/0', index: 0 },
        hashed: { hash: 0, stringified: '0' },
        // TODO Why is status sometimes in body sometimes not?
        status: 'missing',
        values: null,
        cookie: '1'
    }], 'missing')
    dispatcher.dispatch({
        promise: '2/0',
        module: 'diffuser',
        destination: 'router',
        method: 'route',
        hashed: { hash: 1, stringified: '1' },
        to: { promise: '1/0', index: 0 },
        from: { promise: '1/0', index: 0 },
        cookie: '1',
        body: {}
    })
    okay(connector.splice(0), [{
        promise: '2/0',
        module: 'diffuser',
        destination: 'receiver',
        method: 'receive',
        to: { promise: '1/0', index: 0 },
        from: { promise: '1/0', index: 0 },
        hashed: { hash: 1, stringified: '1' },
        cookie: '1',
        body: {}
    }], 'route')
    dispatcher.dispatch({
        promise: '2/0',
        module: 'diffuser',
        destination: 'receiver',
        method: 'receive',
        hashed: { hash: 0, stringified: '0' },
        to: { promise: '1/0', index: 0 },
        from: { promise: '1/0', index: 0 },
        cookie: '1',
        body: {}
    })
    okay(connector.splice(0), [{
        promise: '2/0',
        module: 'diffuser',
        destination: 'source',
        method: 'respond',
        to: { promise: '1/0', index: 0 },
        from: { promise: '1/0', index: 0 },
        hashed: { hash: 0, stringified: '0' },
        status: 'missing',
        values: null,
        cookie: '1'
    }], 'receive missing')
    dispatcher.dispatch({
        promise: '2/0',
        module: 'diffuser',
        destination: 'receiver',
        method: 'receive',
        to: { promise: '1/0', index: 0 },
        from: { promise: '1/0', index: 0 },
        hashed: { hash: 1, stringified: '1' },
        cookie: '1',
        body: {}
    })
    okay(actions.splice(0), [{
        promise: '2/0',
        module: 'diffuser',
        destination: 'receiver',
        method: 'receive',
        to: { promise: '1/0', index: 0 },
        from: { promise: '1/0', index: 0 },
        hashed: { hash: 1, stringified: '1' },
        cookie: '1',
        body: {}
    }], 'receive missing')
    dispatcher.dispatch({
        promise: '2/0',
        module: 'diffuser',
        destination: 'source',
        method: 'respond',
        to: { promise: '1/0', index: 0 },
        from: { promise: '1/0', index: 0 },
        hashed: { hash: 1, stringified: '1' },
        cookie: cliffhanger.invoke(function (error, result) {
            okay(result, {
                promise: '2/0',
                module: 'diffuser',
                destination: 'source',
                method: 'respond',
                to: { promise: '1/0', index: 0 },
                from: { promise: '1/0', index: 0 },
                hashed: { hash: 1, stringified: '1' },
                cookie: '1',
                body: {}
            }, 'response')
        }),
        body: {}
    })
}
