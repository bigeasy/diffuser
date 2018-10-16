#!/usr/bin/env node

/*
    ___ usage ___ en_US ___
    usage: diffuser

      -b, --bind <interface:port> end point for consensus
      -B, --buckets     <integer> count of buckets
      -c, --compassion   <string> compassion URL
      -i, --id               <id> consensus id
      -I, --island       <island> consensus island
      --help                      display this message

    ___ $ ___ en_US ___

    ___ . ___
*/
require('arguable')(module, function (program, callback) {
    program.helpIf(program.ultimate.help)
    program.required('bind', 'buckets', 'compassion')
    program.validate(require('arguable/bindable'), 'bind')

    var Destructible = require('destructible')
    var destructible = new Destructible('t/mingle.bin')
    program.on('shutdown', destructible.destroy.bind(destructible))

    var logger = require('prolific.logger').createLogger('mingle')

    var shuttle = require('foremost')('prolific.shuttle')
    shuttle.start(logger)
    destructible.destruct.wait(shuttle, 'close')

    destructible.completed.wait(callback)

    var cadence = require('cadence')

    var Consensus = require('./consensus')

    var Olio = require('olio')

    var http = require('http')
    var destroyer = require('server-destroy')

    var Initializer = require('./initializer')
    var Embarkator = require('./embarkator')
    var Updater = require('./updater')

    var Socketeer = require('./socketeer')

    var UserAgent = require('vizsla')
    var ua = new UserAgent().bind({ url: program.ultimate.compassion })

    var Downgrader = require('downgrader')
    var downgrader = new Downgrader

    var delta = require('delta')

    var Operation = require('operation')

    cadence(function (async) {
        var consensus = new Consensus(program.ultimate.compassion, +program.ultimate.buckets)
        var server = http.createServer(consensus.reactor.middleware)

        server.on('upgrade', Operation([ downgrader, 'upgrade' ]))

        destroyer(server)
        destructible.destruct.wait(server, 'destroy')
        var socketeer = new Socketeer(destructible)
        async(function () {
            destructible.monitor('initializer', Initializer, async())
            destructible.monitor('embarkator', Embarkator, {
                ua: ua,
                url: 'http://' + String(program.ultimate.bind) + '/',
                island: program.ultimate.island,
                id: program.ultimate.id
            }, async())
            destructible.monitor('updater', Updater, socketeer, async())
        }, function (initializer, embarkator, updater) {
            downgrader.on('socket', function (request, socket) {
                socketeer.queue.push({ request: request, socket: socket })
            })
            var embark = initializer.arrived.pump(embarkator, 'push', destructible.monitor('embark'))
            destructible.destruct.wait(embark, 'destroy')
            var update = consensus.routes.pump(updater, 'push', destructible.monitor('update'))
            destructible.destruct.wait(update, 'destroy')
            async(function () {
                var descendent = require('foremost')('descendent')
                descendent.increment()
                destructible.destruct.wait(descendent, 'decrement')
            }, function () {
                program.ultimate.bind.listen(server, async())
            }, function () {
                delta(destructible.monitor('http')).ee(server).on('close')
                destructible.monitor('olio', Olio, async())
            }, function (olio) {
                updater.olio.unlatch(null, olio)
                initializer.olio.unlatch(null, olio)
                socketeer.olio.unlatch(null, olio)
                program.ready.unlatch()
            })
        })
    })(destructible.monitor('initialize', true))
})
