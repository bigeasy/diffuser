require('proof')(12, require('cadence')(prove))

function prove (async, okay) {
    var Requester = require('../requester')
    var Cache = require('magazine')
    var Cliffhanger = require('cliffhanger')
    var cliffhanger = new Cliffhanger
    var requests = new Cache().createMagazine()
    var connector = []
    function Hash (key) {
        return { hash: key, stringified: String(key), key: key }
    }
    var requester = new Requester({
        cliffhanger: cliffhanger,
        requests: requests,
        Hash: Hash,
        connector: connector,
        index: 1,
        registrar: {
            register: function () {},
            unregister: function () {}
        },
        timeout: 100
    })
    requester.setRoutes({
        event: { action: 'depart', promise: '2/0' },
        promise: '2/0',
        self: '1/0',
        buckets: [ '2/0', '2/0', '2/0', '1/0', '1/0', '1/0', '1/0' ],
        properties: { '1/0': { count: 2 }, '2/0': { count: 2 } }
    })
    async(function () {
        requester.register(1, async())
        okay(connector.shift(), {
            promise: '2/0',
            module: 'diffuser',
            destination: 'router',
            method: 'register',
            to: { promise: '2/0', index: 1 },
            from: { promise: '1/0', index: 1 },
            hashed: { hash: 1, stringified: '1', key: 1 },
            cookie: '1'
        }, 'register')
        cliffhanger.resolve('1', [ null, { status: 'received' } ])
    }, function (registered) {
        okay(registered, 'registered')
        requester.unregister(1, async())
        okay(connector.shift(), {
            promise: '2/0',
            module: 'diffuser',
            destination: 'router',
            method: 'unregister',
            to: { promise: '2/0', index: 1 },
            from: { promise: '1/0', index: 1 },
            hashed: { hash: 1, stringified: '1', key: 1 },
            cookie: '2'
        }, 'register')
        cliffhanger.resolve('2', [ null, { status: 'received' } ])
    }, function (unregistered) {
        okay(unregistered, 'unregistered')
        requester.route('receiver', 1, 'x', async())
        okay(connector.shift(), {
            promise: '2/0',
            module: 'diffuser',
            destination: 'router',
            method: 'route',
            to: { promise: '2/0', index: 1 },
            from: { promise: '1/0', index: 1 },
            hashed: { hash: 1, stringified: '1', key: 1 },
            cookie: '3',
            body: 'x'
        }, 'route receiver')
        cliffhanger.resolve('3', [ null, { status: 'received', values: [ 0 ] } ])
    }, function (routed) {
        okay(routed, { status: 'received', values: [ 0 ] }, 'routed receiver')
        requester.route('router', 1, 'x', async())
        okay(connector.shift(), {
            promise: '2/0',
            module: 'diffuser',
            destination: 'router',
            method: 'receive',
            to: { promise: '2/0', index: 1 },
            from: { promise: '1/0', index: 1 },
            hashed: { hash: 1, stringified: '1', key: 1 },
            cookie: '4',
            body: 'x'
        }, 'route router')
        cliffhanger.resolve('4', [ null, { status: 'received', values: [ 0 ] } ])
    }, function (routed) {
        okay(routed, { status: 'received', values: [ 0 ] }, 'routed router')
        requester.register(1, async())
        connector.shift()
        async(function () {
            setTimeout(async(), 101)
        }, function () {
            requester.expire()
        })
    }, function (registered) {
        okay(!registered, 'timedout')
        requester.route2('router', { key: 1, body: 'x' }, 'message', async())
        okay(connector.shift(), {
            promise: '2/0',
            module: 'diffuser',
            destination: 'router',
            index: 0,
            version: 2,
            method: 'receive',
            to: { promise: '2/0', index: 1 },
            from: { promise: '1/0', index: 1 },
            hashed: { hash: 1, stringified: '1', key: 1 },
            cookie: '1',
            body: 'x',
            context: 'message'
        }, 'route2 object with context and callback')
        var cartridge = requests.hold('1', null)
        cartridge.value.callback.call()
        cartridge.remove()
    }, function () {
        requester.route2('receiver', [{ key: 1, body: 'x' }], async())
        okay(connector.shift(), {
            promise: '2/0',
            module: 'diffuser',
            destination: 'router',
            index: 0,
            version: 2,
            method: 'route',
            to: { promise: '2/0', index: 1 },
            from: { promise: '1/0', index: 1 },
            hashed: { hash: 1, stringified: '1', key: 1 },
            cookie: '2',
            body: 'x',
            context: null
        }, 'route2 array no context')
        async(function () {
            setTimeout(async(), 115)
        }, function () {
            requester.expire()
            return []
        })
    }, function (successful, responses) {
        okay({
            successful: successful,
            responses: responses
        }, {
            successful: false,
            responses: [{ status: 'timeout', values: null }]
        }, 'expired')
    })
}
