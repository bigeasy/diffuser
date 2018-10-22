require('proof')(1, prove)

function prove (okay) {
    var routes = require('./update')
    var Router = require('../lookup')
    var router = new Router(routes)
    okay(router.route({ hash: 0 }), { promise: '1/0', index: 0 }, 'route')
}
