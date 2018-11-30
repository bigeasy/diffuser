require('proof')(1, prove)

function prove (okay, callback) {
    var Destructible = require('destructible')
    var destructible = new Destructible(15000, 't/olio.t')

    destructible.completed.wait(callback)

    var Diffuser = require('../olio')

    var Mock = require('olio/mock')
    var path = require('path')
    var fs = require('fs')

    try {
        fs.unlinkSync(path.join(__dirname, 'socket'))
    } catch (e) {
        if (e.code != 'ENOENT') {
            throw e
        }
    }

    var cadence = require('cadence')

    cadence(function (async) {
        async(function () {
            destructible.durable('mock', Mock, {
                socket: 't/socket',
                children: {
                    compassion: {
                        module: 'compassion.colleague/olio',
                        workers: 1,
                        properties: {}
                    },
                    diffuser: {
                        path: path.resolve(__dirname, '../olio'),
                        workers: 1,
                        properties: {
                            bind: { iface: '0.0.0.0', port: 8386 },
                            location: { hostname: '127.0.0.1', port: 8386 },
                            properties: 'diffuser',
                            buckets: 7
                        }
                    },
                    mingle: {
                        module: 'mingle/olio',
                        workers: 1,
                        properties: {
                            module: 'mingle.static',
                            format: 'http://%s:%d/',
                            addresses: [ '127.0.0.1:8486' ]
                        }
                    },
                    program: {
                        path: path.resolve(__dirname, './program'),
                        workers: 1,
                        properties: {
                            diffuser: { island: 'program', id: 'first/program', isRouter: true }
                        }
                    }
                }
            }, async())
        }, function (children) {
            console.log(children)
            children.program[0].register({ key: 0 }, async())
        }, function () {
            okay('arrived')
        })
    })(destructible.durable('test'))
}
