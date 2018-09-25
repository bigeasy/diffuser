#!/usr/bin/env node

/*
    ___ usage ___ en_US ___
    usage: diffuser

            --help                      display this message

    ___ $ ___ en_US ___

    ___ . ___
*/
require('arguable')(module, function (program, callback) {
    program.helpIf(program.ultimate.help)

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

    cadence(function (async) {
        async(function () {
            destructible.monitor('olio', Olio, async())
        }, function (olio) {
            program.ready.unlatch()
        })
    })(destructible.monitor('initialize', true))
})
