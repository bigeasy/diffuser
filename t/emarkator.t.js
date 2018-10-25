require('proof')(1, prove)

function prove (okay, callback) {
    var Destructible = require('destructible')
    var destructible = new Destructible('t/embarkator.t')

    var UserAgent = require('vizsla')
    var Interlocutor = require('interlocutor')

    destructible.completed.wait(callback)
    var Embarkator = require('../embarkator')
    var cadence = require('cadence')

    var Signal = require('signal')
    var registered = new Signal

    var Reactor = require('reactor')

    function Service () {
        this.reactor = new Reactor(this, function (dispatcher) {
            dispatcher.dispatch('POST /register', 'register')
        })
    }

    Service.prototype.register = cadence(function (async) {
        okay(true, 'registered')
        registered.unlatch()
        return 200
    })

    var service = new Service

    var ua = new UserAgent().bind({
        url: 'http://128.0.0.1:8888/',
        http: new Interlocutor(service.reactor.middleware)
    })


    cadence(function (async) {
        async(function () {
            destructible.monitor('embarkator', Embarkator, {
                location: 'http://127.0.0.1:8386/',
                ua: ua
            }, async())
        }, function (embarkator) {
            registered.wait(async())
            embarkator.push({ name: 'run', count: 1 })
        })
    })(destructible.monitor('test'))

}
