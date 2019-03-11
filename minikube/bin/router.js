var cadence = require('cadence')
var delta = require('delta')
var Diffuser = require('../..')
var net = require('net')

module.exports = cadence(function (async, destructible, olio, properties) {
    async(function () {
        destructible.durable('diffuser', Diffuser, {
            olio: olio,
            timeout: 5000
        }, async())
    }, function (diffuser) {
        var server = net.createServer(function (socket) { socket.close() })
        delta(async()).ee(server).on('listening')
        server.listen(properties.bind.port, properties.bind.iface)
    })
})
