var cadence = require('cadence')
var Diffuser = require('..')

module.exports = cadence(function (async, destuctible, olio, properties) {
    async(function () {
        console.log('will diffuser')
        destuctible.monitor('diffuser', Diffuser, {
            olio: olio,
            router: function () {
                console.log(arguments)
            },
            sink: function () {
                console.log(arguments)
            },
            timeout: 5000
        }, async())
    }, function () {
        console.log('did create')
        return null
    })
})
