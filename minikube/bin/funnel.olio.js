exports.configure = function (configuration) {
    var path = require('path')
    var iface = require('os').networkInterfaces()[configuration.iface].filter(function (iface) {
        return iface.family == 'IPv4'
    }).pop().address
    return {
        socket: '/var/run/funnel.socket',
        constituents: {
            prolific: {
                module: 'inlet.prolific',
                workers: 1,
                properties: {}
            },
            udp: {
                module: 'inlet.udp',
                workers: 1,
                properties: {
                    to: 'prolific',
                    json: true,
                    iface: '0.0.0.0',
                    port: 514,
                    extractor: path.join(__dirname, 'extractor.js')
                }
            }
        }
    }
}
