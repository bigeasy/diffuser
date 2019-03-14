var cadence = require('cadence')
var delta = require('delta')
var Diffuser = require('../..')
var net = require('net')
var Conduit = require('conduit')

var Worker = require('./worker')
var Tracker = require('./tracker')

module.exports = cadence(function (async, destructible, olio, properties) {
    var tracker = new Tracker
    var expirator = setInterval(tracker.expire.bind(tracker), 1000)
    destructible.destruct.wait(function () { clearInterval(expirator) })
    async(function () {
        destructible.durable('diffuser', Diffuser, {
            olio: olio,
            receiver: tracker.receive.bind(tracker),
            timeout: 5000
        }, async())
    }, function (diffuser) {
        async(function () {
            diffuser.register(properties.address, async())
        }, function () {
            olio.sender('mingle', cadence(function (async, destructible, inbox, outbox) {
                destructible.durable('conduit', Conduit, inbox, outbox, null, async())
            }), async())
        }, function (mingle) {
            destructible.durable('worker', Worker, tracker, diffuser, mingle.processes[0].conduit, properties.address, async())
        }, function (worker) {
            var server = net.createServer(function (socket) { worker.socket(socket) })
            delta(async()).ee(server).on('listening')
            server.listen(properties.bind.port, properties.bind.iface)
        })
    })
})
