require('proof')(1, prove)

function prove (okay, callback) {
    var Destructible = require('destructible')
    var destructible = new Destructible('t/olio.t')

    destructible.completed.wait(callback)

    var Diffuser = require('../olio')

    var cadence = require('cadence')

    cadence(function (async) {
        async(function () {
        }, function () {
            okay(true, 'done')
        })
    })(destructible.monitor('test'))
}
