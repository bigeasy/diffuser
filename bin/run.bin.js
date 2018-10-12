#!/usr/bin/env node

/*
    ___ usage ___ en_US ___
    usage: olio <socket> [command] <args>

        --help              display this message
    ___ . ___
 */
require('arguable')(module, function (program, callback) {
    var Procedure = require('conduit/procedure')

    var Destructible = require('destructible')
    var destructible = new Destructible('bin/run.bin.js')
    var cadence = require('cadence')

    var logger = require('prolific.logger').createLogger('olio.echo')
    var shuttle = require('foremost')('prolific.shuttle')
    shuttle.start(logger)

    program.on('shutdown', destructible.destroy.bind(destructible))
    destructible.destruct.wait(shuttle, 'close')

    var coalesce = require('extant')

    var Olio = require('olio')
    var Diffuser = require('..')

    // TODO Curious case where if we exit while waiting.
    destructible.completed.wait(callback)

    var http = require('http')

    var cadence = require('cadence')

    var Reactor = require('reactor')
    var destroyer = require('server-destroy')
    var delta = require('delta')

    function Service (diffuser) {
        this.diffuser = diffuser
        this.reactor = new Reactor(this, function (dispatcher) {
            dispatcher.dispatch('GET /', 'index')
            dispatcher.dispatch('POST /value/:key', 'post')
            dispatcher.dispatch('GET /value/:key', 'get')
            dispatcher.dispatch('GET /route/:index', 'route')
        })
    }

    Service.prototype.post = cadence(function (async, request, key) {
        async(function () {
            this.diffuser.route('router', key, {
                module: 'example',
                method: 'set',
                key: key,
                value: request.body.value
            }, async())
        }, function (response) {
            console.log('>>>>> !!!!! >>>!>!>>!', response)
            return 200
        })
    })

    Service.prototype.get = cadence(function (async, request, key) {
        async(function () {
            this.diffuser.route('router', key, {
                module: 'example',
                method: 'get',
                key: key
            }, async())
        }, function (value) {
            return [ 200, { 'content-type': 'text/plain' }, value ]
        })
    })

    Service.prototype.route = cadence(function (async, request, index) {
        async(function () {
            this.diffuser.route('sink', {
                module: 'example',
                method: 'get',
                key: { name: 'run', index: +index }
            }, async())
        }, function (value) {
            return value
        })
    })

    cadence(function (async) {
        async(function () {
            destructible.monitor('olio', Olio, async())
        }, function (olio) {
            async(function () {
                setImmediate(async())
            }, function () {
                var storage = {}
                destructible.monitor('diffuser', Diffuser, {
                    olio: olio,
                    router: cadence(function (async, envelope) {
                        switch (envelope.method) {
                        case 'set':
                            storage[envelope.key] = envelope.value
                            return []
                        case 'get':
                            return coalesce(storage[envelope.key])
                        }
                    }),
                    terminus: cadence(function (async, envelope) {
                        return { index: olio.index }
                    })
                }, async())
            }, function (diffuser) {
                var service = new Service(diffuser)
                async(function () {
                    // TODO Maybe post and wait to see that it is set. Yeah.
                    diffuser.register({ name: 'run', index: olio.index }, async())
                }, function () {
                    service.post({ body: { value: 'value' } }, 'key', async())
                }, function () {
                    service.get({ body: {} }, 'key', async())
                }, [], function (response) {
                    console.log(response)
                    service.route({ body: {} }, 'key', async())
                    var server = http.createServer(service.reactor.middleware)
                    destroyer(server)
                    destructible.destruct.wait(server, 'destroy')
                    async(function () {
                        server.listen(8088, async())
                    }, function () {
                        delta(destructible.monitor('http')).ee(server).on('close')
                        logger.info('started', { hello: 'world', pid: program.pid })
                        program.ready.unlatch()
                    })
                })
            })
        })
    })(destructible.monitor('initialize', true))
})
