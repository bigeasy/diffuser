require('proof')(1, prove)

function prove (okay) {
    var Router = require('../lookup')
    var router = new Router([ '1/0' ], { '1/0': 1 })
    okay(router.route({ hash: 0 }), { promise: '1/0', index: 0 }, 'route')
}
