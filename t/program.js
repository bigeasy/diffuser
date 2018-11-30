var cadence = require('cadence')
var Diffuser = require('..')

module.exports = cadence(function (async, destuctible, olio, properties) {
    async(function () {
        destuctible.durable('diffuser', Diffuser, {
            olio: olio,
            router: function () {
                console.log(arguments)
            },
            sink: function () {
                console.log(arguments)
            },
            timeout: 5000
        }, async())
    }, function (requester) {
        return requester
    })
})
