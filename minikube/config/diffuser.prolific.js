exports.triage = function () { return function () { return true } }

exports.process = function () {
    var Syslog = require('prolific.syslog')
    var UDP = require('prolific.udp')
    var HTTP = require('prolific.http')
    var influxdb = require('prolific.influxdb')
    var syslog = new Syslog({ serializer: require('wafer') })
    var cadence = require('cadence')
    return cadence(function (async, destructible) {
        async(function () {
            destructible.durable('udp', UDP, async())
            destructible.durable('http', HTTP, {
                fetch: {
                    url: 'http://influxdb.tick.svc.cluster.local:8086/write?db=diffuser',
                    method: 'POST'
                },
                join: ''
            }, async())
        }, function (udp, http) {
            function funnel (message) {
                udp.send({
                    hostname: process.env.FUNNEL_SERVICE_HOST,
                    port: +process.env.FUNNEL_SERVICE_PORT
                }, JSON.stringify(message) + '\n')
            }
            return function (entry) {
                if (entry.qualifier == 'conduit.window' || entry.qualified == 'diffuser#monkey') {
                    funnel(entry)
                } else if (
                    entry.qualifier == 'diffuser' && entry.metric
                ) {
                    switch (entry.label) {
                    case 'response.complete':
                        http.send(influxdb({
                            measurement: 'response',
                            tags: {
                                status: entry.status,
                                from: entry.from,
                                to: entry.to
                            },
                            fields: { duration: entry.duration },
                            timestamp: entry.when
                        }))
                        break
                    case 'request.complete':
                        http.send(influxdb({
                            measurement: 'request',
                            tags: {
                                successful: entry.successful,
                                from: entry.from
                            },
                            fields: { duration: entry.duration },
                            timestamp: entry.when
                        }))
                        break
                    case 'route':
                        http.send(influxdb({
                            measurement: 'route',
                            tags: { status: entry.status },
                            fields: { duration: entry.duration },
                            timestamp: entry.when
                        }))
                        break
                    }
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
