require('proof')(1, require('cadence')(prove))

function prove (async, okay) {
    var caller = {
        invoke: function (ignore, callback) {
            callback(null, [
                'http://127.0.0.1:8089',
                'http://127.0.0.1:8089',
                'http://127.0.0.1:8087'
            ])
        }
    }
    var cadence = require('cadence')
    var responses = [{
        promise: '1/0'
    }, {
        promise: '2/0'
    }]
    var http = require('http')
    var server = http.createServer(function (request, response) {
        response.writeHead(200, { 'content-type': 'application/json' })
        response.end(JSON.stringify(responses.shift()))
    })
    var Discoverer = require('../discoverer')
    var discoverer = new Discoverer(caller)
    async([function () {
        server.close()
    }], function () {
        server.listen(8089, '127.0.0.1', async())
    }, function () {
        discoverer.discover(async())
    }, function (routes) {
        okay(routes, { promise: '2/0' }, 'routes')
    })
}
