require('proof')(1, prove)

function prove (okay, callback) {
    var Listener = require('../listener')

    var Destructible = require('destructible')
    var destructible = new Destructible('t/listener.t')

    destructible.completed.wait(callback)

    var cadence = require('cadence')

    cadence(function (async) {
        async(function () {
            destructible.monitor('listener', Listener, {
                send: function () {
                    var vargs = Array.prototype.slice.call(arguments)
                    var callback = vargs.pop()
                    okay(vargs, [
                        'run', 0,
                        {
                            module: 'olio',
                            method: 'connect',
                            to: { name: 'run', index: 0 }
                        },
                        { isSocket: true }
                    ], 'send')
                    callback()
                }
            }, async())
        }, function (listener) {
            listener.socket({
                headers: {
                    'x-diffuser-to-name': 'run',
                    'x-diffuser-to-index': '0'
                }
            }, { isSocket: true })
            destructible.destroy()
            listener.socket({
                headers: {
                    'x-diffuser-to-name': 'run',
                    'x-diffuser-to-index': '0'
                }
            }, { isSocket: true })
        })
    })(destructible.monitor('test'))
}
