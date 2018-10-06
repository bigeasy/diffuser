require('proof')(1, prove)

function prove (okay, callback) {
    var Destructible = require('destructible')
    var destructible = new Destructible('t/diffuser.bin.t')

    destructible.completed.wait(callback)

    var cadence = require('cadence')

    var bin = require('../diffuser.bin')

    var Mock = require('olio/mock')
    var mock = new Mock

    var program = bin([], {}, destructible.monitor('run'))

    cadence(function (async) {
        async(function () {
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
