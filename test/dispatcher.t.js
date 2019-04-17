require('proof')(14, prove)

function prove (okay) {
    var Cache = require('magazine')
    var requests = new Cache().createMagazine()
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
        requests: requests,
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
    dispatcher.receive({
        module: 'diffuser',
        promise: '1/0',
        destination: 'router',
        method: 'synchronize',
        to: { promise: '1/0', index: 0 },
        from: { promise: '1/0', index: 0 },
        series: 0xffffffff,
        body: null
    })
    dispatcher.receive({
        module: 'diffuser',
        promise: '2/0',
        destination: 'router',
        method: 'synchronize',
        to: { promise: '1/0', index: 0 },
        from: { promise: '2/0', index: 0 },
        series: 0xffffffff,
        body: null
    })
    dispatcher.receive({
        module: 'diffuser',
        promise: '2/0',
        destination: 'router',
        method: 'receive',
        to: { promise: '1/0', index: 0 },
        from: { promise: '2/0', index: 0 },
        hashed: { hash: 2, stringified: '2' },
        series: 0,
        body: null
    })
    dispatcher.setRoutes({
        event: { action: 'arrive', promise: '2/0' },
        self: '1/0',
        promise: '2/0',
        properties: { '1/0': { count: 1 }, '2/0': { count: 1 } },
        buckets: [ '1/0', '1/0', '1/0', '2/0', '2/0', '2/0', '2/0' ]
    })
    dispatcher.receive({
        module: 'diffuser',
        promise: '2/0',
        destination: 'router',
        method: 'receive',
        to: { promise: '1/0', index: 0 },
        from: { promise: '2/0', index: 0 },
        hashed: { hash: 2, stringified: '2' },
        series: 1,
        body: null
    })
    dispatcher.receive({
        module: 'diffuser',
        promise: '2/0',
        destination: 'router',
        method: 'synchronize',
        to: { promise: '1/0', index: 0 },
        from: { promise: '1/0', index: 0 },
        series: 0,
        body: { hash: 1, stringified: '1' }
    })
    dispatcher.receive({
        module: 'diffuser',
        promise: '2/0',
        destination: 'router',
        method: 'synchronize',
        to: { promise: '1/0', index: 0 },
        from: { promise: '1/0', index: 0 },
        series: 1,
        body: { hash: 5, stringified: '5' }
    })
    dispatcher.receive({
        module: 'diffuser',
        promise: '2/0',
        destination: 'router',
        method: 'synchronize',
        to: { promise: '1/0', index: 0 },
        from: { promise: '1/0', index: 0 },
        series: 2,
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
        series: 0,
        body: null
    }, {
        module: 'diffuser',
        promise: '2/0',
        destination: 'router',
        method: 'receive',
        to: { promise: '1/0', index: 0 },
        from: { promise: '2/0', index: 0 },
        hashed: { hash: 2, stringified: '2' },
        series: 1,
        body: null
    }], 'synchronize')
    dispatcher.receive({
        promise: '2/0',
        module: 'diffuser',
        destination: 'router',
        method: 'route',
        hashed: { hash: 5, stringified: '5' },
        to: { promise: '1/0', index: 0 },
        from: { promise: '1/0', index: 0 },
        series: 3,
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
        series: 3,
        cookie: '1'
    }], 'reroute')
    dispatcher.receive({
        promise: '2/0',
        module: 'diffuser',
        destination: 'router',
        method: 'unregister',
        hashed: { hash: 0, stringified: '0' },
        to: { promise: '1/0', index: 0 },
        from: { promise: '1/0', index: 0 },
        series: 4,
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
    dispatcher.receive({
        promise: '2/0',
        module: 'diffuser',
        destination: 'router',
        method: 'unregister',
        hashed: { hash: 1, stringified: '1' },
        to: { promise: '1/0', index: 0 },
        from: { promise: '2/0', index: 0 },
        series: 2,
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
    dispatcher.receive({
        promise: '2/0',
        module: 'diffuser',
        destination: 'router',
        method: 'unregister',
        hashed: { hash: 1, stringified: '1' },
        to: { promise: '1/0', index: 0 },
        from: { promise: '1/0', index: 0 },
        series: 5,
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
    dispatcher.receive({
        promise: '2/0',
        module: 'diffuser',
        destination: 'router',
        method: 'register',
        hashed: { hash: 1, stringified: '1' },
        to: { promise: '1/0', index: 0 },
        from: { promise: '1/0', index: 0 },
        series: 6,
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
    dispatcher.receive({
        promise: '2/0',
        module: 'diffuser',
        destination: 'router',
        method: 'route',
        hashed: { hash: 1, stringified: '1' },
        to: { promise: '1/0', index: 0 },
        from: { promise: '1/0', index: 0 },
        series: 7,
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
    dispatcher.receive({
        promise: '2/0',
        module: 'diffuser',
        destination: 'router',
        method: 'route',
        hashed: { hash: 0, stringified: '0' },
        to: { promise: '1/0', index: 0 },
        from: { promise: '1/0', index: 0 },
        series: 8,
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
    dispatcher.receive({
        promise: '2/0',
        module: 'diffuser',
        destination: 'router',
        method: 'route',
        hashed: { hash: 1, stringified: '1' },
        to: { promise: '1/0', index: 0 },
        from: { promise: '1/0', index: 0 },
        series: 9,
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
    dispatcher.receive({
        promise: '2/0',
        module: 'diffuser',
        destination: 'receiver',
        method: 'receive',
        hashed: { hash: 0, stringified: '0' },
        to: { promise: '1/0', index: 0 },
        from: { promise: '1/0', index: 0 },
        series: 10,
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
    dispatcher.receive({
        promise: '2/0',
        module: 'diffuser',
        destination: 'receiver',
        method: 'receive',
        to: { promise: '1/0', index: 0 },
        from: { promise: '1/0', index: 0 },
        hashed: { hash: 1, stringified: '1' },
        series: 11,
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
        series: 11,
        cookie: '1',
        body: {}
    }], 'receive missing')
    dispatcher.receive({
        promise: '2/0',
        module: 'diffuser',
        destination: 'source',
        method: 'respond',
        to: { promise: '1/0', index: 0 },
        from: { promise: '1/0', index: 0 },
        hashed: { hash: 1, stringified: '1' },
        series: 12,
        cookie: cliffhanger.invoke(function (error, result) {
            okay(result, {
                promise: '2/0',
                module: 'diffuser',
                destination: 'source',
                method: 'respond',
                to: { promise: '1/0', index: 0 },
                from: { promise: '1/0', index: 0 },
                hashed: { hash: 1, stringified: '1' },
                series: 12,
                cookie: '1',
                body: {}
            }, 'response')
        }),
        body: {}
    })
    requests.hold('1', {
        when: Date.now(),
        context: 'message',
        responses: [ null, null ],
        received: 0,
        callback: function (error, successful, responses) {
            okay({
                successful: successful,
                responses: responses
            }, {
                successful: true,
                responses: [{
                    status: 'received',
                    values: [ 1 ]
                }, {
                    status: 'received',
                    values: [ 2 ]
                }]
            }, 'reduced')
        }
    }).release()
    dispatcher.receive({
        promise: '2/0',
        module: 'diffuser',
        destination: 'source',
        method: 'respond',
        version: 2,
        cookie: '0',
        to: { promise: '1/0', index: 0 },
        from: { promise: '1/0', index: 0 },
        hashed: { hash: 1, stringified: '1' },
        series: 13,
        body: {}
    })
    dispatcher.receive({
        promise: '2/0',
        module: 'diffuser',
        destination: 'source',
        method: 'respond',
        index: 0,
        version: 2,
        cookie: '1',
        status: 'received',
        to: { promise: '1/0', index: 0 },
        from: { promise: '1/0', index: 0 },
        hashed: { hash: 1, stringified: '1' },
        series: 14,
        values: [ 1 ]
    })
    var cartridge = requests.hold('1', null)
    okay({
        received: cartridge.value.received,
        responses: cartridge.value.responses
    }, {
        received: 1,
        responses:  [{ status: 'received', values: [ 1 ] }, null]
    }, 'first response')
    cartridge.release()
    dispatcher.receive({
        promise: '2/0',
        module: 'diffuser',
        destination: 'source',
        method: 'respond',
        index: 1,
        version: 2,
        cookie: '1',
        status: 'received',
        to: { promise: '1/0', index: 0 },
        from: { promise: '1/0', index: 0 },
        hashed: { hash: 1, stringified: '1' },
        series: 15,
        values: [ 2 ]
    })
}
