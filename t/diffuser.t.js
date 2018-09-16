require('proof')(2, prove)

function prove (okay, callback) {
    var Destructible = require('destructible')
    var destructible = new Destructible('t/consensus.t.js')

    var Diffuser = require('../diffuser')

    var http = require('http')
    var destroyer = require('server-destroy')
    var delta = require('delta')

    var UserAgent = require('vizsla')
    var ua = new UserAgent

    var Counterfeiter = require('compassion.counterfeiter')

    destructible.completed.wait(callback)

    var cadence = require('cadence')

    cadence(function (async) {
        var diffusers = {}
        async([function () {
            destructible.destroy()
        }], function () {
            destructible.monitor('counterfeiter', Counterfeiter, {
                ping: {
                    application: 150,
                    paxos: 150,
                    chaperon: 150
                },
                timeout: {
                    paxos: 450,
                    chaperon: 450,
                    http: 450
                }
            }, async())
        }, function (counterfeiter) {
            var events = counterfeiter.events.shifter()
            diffusers.first = new Diffuser('http://127.0.0.1:8386/', 7)
            async(function () {
                var server = http.createServer(diffusers.first.reactor.middleware)
                destroyer(server)
                destructible.destruct.wait(server, 'destroy')
                delta(destructible.monitor('first')).ee(server).on('close')
                server.listen(8081, '127.0.0.1', async())
            }, function () {
                ua.fetch({
                    url: 'http://127.0.0.1:8386/register',
                    timeout: 1000,
                    post: {
                        token: '-',
                        island: 'diffuser',
                        id: 'first',
                        url: 'http://127.0.0.1:8081/',
                        bootstrap: true,
                        join: true,
                        arrive: true,
                        acclimated: true,
                        depart: true,
                        properties: { location: 'http://127.0.0.1:9081' }
                    },
                    parse: 'json',
                    raise: true
                }, async())
                counterfeiter.events.shifter().join(function (event) {
                    if (
                        event.type == 'consumed' &&
                        event.id == 'first' &&
                        event.body.promise == '1/0'
                    ) {
                        return true
                    }
                    return false
                }, async())
            }, function () {
                okay(diffusers.first._token != null, 'registered')
                ua.fetch({ url: 'http://127.0.0.1:8081/', parse: 'text', raise: true }, async())
            }, function (body) {
                okay(body, 'Diffuser Consensus API\n', 'index')
                diffusers.second = new Diffuser('http://127.0.0.1:8386/', 7)
                var server = http.createServer(diffusers.second.reactor.middleware)
                destroyer(server)
                destructible.destruct.wait(server, 'destroy')
                delta(destructible.monitor('second')).ee(server).on('close')
                server.listen(8082, '127.0.0.1', async())
            }, function () {
                ua.fetch({
                    url: 'http://127.0.0.1:8386/register',
                    timeout: 1000,
                    post: {
                        token: '-',
                        island: 'diffuser',
                        id: 'second',
                        url: 'http://127.0.0.1:8082/',
                        join: true,
                        arrive: true,
                        acclimated: true,
                        depart: true,
                        properties: { location: 'http://127.0.0.1:9082' }
                    },
                    parse: 'json',
                    raise: true
                }, async())
                counterfeiter.events.shifter().join(function (event) {
                    if (
                        event.type == 'consumed' &&
                        event.id == 'second' &&
                        event.body.promise == '3/0'
                    ) {
                        return true
                    }
                    return false
                }, async())
            }, function () {
                console.log('xxx')
                counterfeiter.terminate('diffuser', 'second')
                counterfeiter.events.shifter().join(function (event) {
                    if (event.type == 'consumed' && event.id == 'first' && event.body.promise == '4/0') {
                        return true
                    }
                    return false
                }, async())
            })
        })
    })(destructible.monitor('test'))
}
