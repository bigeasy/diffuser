require('proof')(4, prove)

function prove (okay, callback) {
    var Destructible = require('destructible')
    var destructible = new Destructible('t/consensus.t.js')

    var Diffuser = require('../consensus')

    var http = require('http')
    var destroyer = require('server-destroy')
    var delta = require('delta')

    var UserAgent = require('vizsla')
    var ua = new UserAgent

    var Population = require('compassion.colleague/population')
    var Resolver = { Static: require('compassion.colleague/resolver/static') }

    var Containerized = require('compassion.colleague/containerized')

    destructible.completed.wait(callback)

    var cadence = require('cadence')

    cadence(function (async) {
        var diffusers = {}
        async(function () {
            var population = new Population(new Resolver.Static([ 'http://127.0.0.1:8486/' ]), new UserAgent)
            destructible.monitor('containerized', Containerized, {
                population: population,
                ping: {
                    chaperon: 150,
                    paxos: 150,
                    application: 150
                },
                timeout: {
                    chaperon: 450,
                    paxos: 450,
                    http: 500
                },
                bind: {
                    networked: {
                        listen: function (server, callback) {
                            server.listen(8486, '127.0.0.1', callback)
                        },
                        address: '127.0.0.1',
                        port: 8486
                    }
                }
            }, async())
        }, function (colleague) {
            var Conference = require('compassion.conference')
            var Counterfeiter = require('compassion.counterfeiter/counterfeiter')(Conference)
            var Application = require('../consensus')
            destructible.monitor('debug', colleague.events.pump(function (envelope) {
             //   console.log(envelope)
            }), 'destructible', null)
            var routes = [function (envelope) {
                okay(envelope.addresses, [ '1/0' ], 'bootstrap')
            }, function (envelope) {
                okay(envelope.addresses, [ '1/0', '2/0' ], 'join')
            }, function (envelope) {
                okay(envelope.addresses, [ '1/0' ], 'depart')
            }, function (envelope) {
                okay(envelope, null, 'end of routes')
            }]
            async(function () {
                var application = new Application(7)
                destructible.monitor('routes', application.routes.pump(function (envelope) {
                    routes.shift()(envelope)
                }), 'destructible', null)
                destructible.monitor('counterfeiter', Counterfeiter, colleague, application, {
                    island: 'island',
                    id: 'first',
                    properties: { isRouter: true }
                }, async())
            }, function (first) {
                async(function () {
                    first.consumed.shifter().join(function (envelope) {
                        return envelope.promise == '1/0'
                    }, async())
                }, function () {
                    var application = new Application(7)
                    destructible.monitor('counterfeiter', true, Counterfeiter, colleague, application, {
                        island: 'island',
                        id: 'second',
                        properties: { isRouter: true }
                    }, async())
                }, function (second) {
                    second.consumed.shifter().join(function (envelope) {
                        return envelope.promise == '2/0'
                    }, async())
                }, function () {
                    colleague.terminate('island', 'second')
                    first.consumed.shifter().join(function (envelope) {
                        console.log('!!! >', envelope)
                        return envelope.promise == '3/0'
                    }, async())
                })
            })
        })
    })(destructible.monitor('test'))
}
