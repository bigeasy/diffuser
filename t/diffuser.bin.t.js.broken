require('proof')(1, prove)

function prove (okay, callback) {
    var Destructible = require('destructible')
    var destructible = new Destructible('t/diffuser.bin.t')

    destructible.completed.wait(callback)

    var cadence = require('cadence')

    var bin = require('../diffuser.bin')

    var Mock = require('olio/mock')
    var mock = new Mock

    var program

    var destroyer = require('server-destroy')
    var http = require('http')
    var server = http.createServer(function (request, response) {
        response.writeHead(200, { 'content-type': 'application/json' })
        respones.write('"OK"')
    })
    destroyer(server)

    cadence(function (async) {
        async(function () {
            server.listen(8888, async())
        }, function () {
            destructible.destruct.wait(server, 'destroy')
            program = bin({
                bind: '127.0.0.1:8088',
                buckets: 7,
                compassion: 'http://127.0.0.1:8888'
            }, {}, destructible.monitor('run'))
            mock.ready.wait(async())
        }, function () {
            mock.initialize('diffuser', 0)
            program.ready.wait(async())
        }, function () {
            okay(true, 'ran')
            program.emit('SIGTERM')
        })
    })(destructible.monitor('test'))
}
