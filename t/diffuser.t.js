require('proof')(1, prove)

function prove (okay) {
    okay(require('..'), 'require')

    function Hash (key) {
        return { hash: key, stringified: String(key), key: key }
    }

    var Router = require('../router')
    function createRouter (promise) {
        var queue = []
        queue.hostname = promise
        return {
            queue: queue,
            router: new Router(queue, promise)
        }
    }
    var network = {
        '1/0': createRouter('1/0'),
        '2/0': createRouter('2/0')
    }
    network['1/0'].router.setBuckets([ '1/0', '1/0', '1/0' ])
}
