require('proof')(1, prove)

function prove (okay, callback) {
    var Destructible = require('destructible')
    var destructible = new Destructible('t/olio.t')

    destructible.completed.wait(callback)

    var Diffuser = require('../olio')

    var Mock = require('olio/mock')

    var cadence = require('cadence')

    cadence(function (async) {
        async(function () {
            destructible.monitor('mock', Mock, {
                children: {
                    compassion: {
                        module: 'compassion.colleague/olio',
                        workers: 1,
                        properties: {}
                    },
                    diffuser: {
                        path: path.resolve(__dirname, '../olio'),
                        workers: 1,
                        properties: { count: 7 }
                    },
                    mingle: {
                        module: 'mingle/olio',
                        workers: 1,
                        properties: {
                            module: 'mingle.static',
                            format: 'http://%s:%d/',
                            argv: [ '127.0.0.1:8486' ]
                        }
                    }
                }
            }, async())
        }, function (children) {
            okay(true, 'done')
            children.child[0].bootstrapped.wait(async())
        }, function (bootstrapped) {
            okay(bootstrapped, 'bootstrapped', 'bootstrapped')
        })
    })(destructible.monitor('test'))
}
