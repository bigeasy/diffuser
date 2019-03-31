exports.triage = function () { return function () { return true } }

exports.process = function () {
    var Syslog = require('prolific.syslog')
    var UDP = require('prolific.udp')
    var syslog = new Syslog({ serializer: require('wafer') })
    var cadence = require('cadence')
    return cadence(function (async, destructible) {
        async(function () {
            destructible.durable('udp', UDP, async())
        }, function (udp) {
            function funnel (message) {
                udp.send({
                    hostname: process.env.FUNNEL_SERVICE_HOST,
                    port: +process.env.FUNNEL_SERVICE_PORT
                }, JSON.stringify(message) + '\n')
            }
            return function (entry) {
                if (entry.qualifier == 'conduit.window') {
                    funnel(entry)
                } else if (
                    entry.qualified != 'olio#memory' &&
                    entry.qualified != 'prolific#memory' &&
                    entry.qualifier != 'vizsla'
                ) {
                    process.stdout.write(syslog.format(entry))
                }
            }
        })
    })
}
