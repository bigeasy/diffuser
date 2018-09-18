require('proof')(1, prove)

function prove (okay, callback) {
    var descendent = require('foremost')('descendent')
    descendent.createMockProcess()

    var Listener = require('../listener')

    var Mock = require('olio/mock')
    var mock = new Mock

    var Olio = require('olio')

    var Destructible = require('destructible')
    var destructible = new Destructible('t/listener.t')

    destructible.completed.wait(callback)

    var cadence = require('cadence')

    cadence(function (async) {
        async(function () {
            destructible.monitor('olio', Olio, async())
            mock.initialize('self', 0)
            mock.sibling('sibling', 1)
        }, function (olio) {
            destructible.monitor('listener', Listener, olio, async())
        }, function (listener) {
            var wait = async()
            descendent.process.on('descendent:sent', function (message, handle) {
                okay(socket === handle, 'socket')
                wait()
            })
            var socket = { destroy: function () {} }
            listener.socket({
                headers: {
                    'x-diffuser-to-name': 'sibling',
                    'x-diffuser-to-index': '0'
                }
            }, socket)

        })
    })(destructible.monitor('test'))
}
