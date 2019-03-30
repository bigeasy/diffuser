exports.configure = function (configuration) {
    var hostname = require('os').networkInterfaces()[configuration.iface].filter(function (iface) {
        return iface.family == 'IPv4'
    }).pop().address
    return {
        socket: '/var/run/diffuser.socket',
        constituents: {
            mingle: {
                module: 'mingle/olio',
                workers: 1,
                properties: {
                    module: 'mingle.kubernetes',
                    format: 'http://%s:%d/',
                    namespace: configuration.namespace,
                    pod: 'diffuser',
                    container: 'diffuser',
                    port: 'compassion'
                }
            },
            compassion: {
                module: 'compassion.colleague/olio',
                workers: 1,
                properties: {
                    ping: { chaperon: 1000, paxos: 1000 },
                    timeout: { chaperon: 3000, paxos: 3000, http: 1000 },
                    bind: { iface: '0.0.0.0', port: 8486 }
                }
            },
            diffuser: {
                path: [ 'olio' ],
                workers: 1,
                properties: {
                    bind: { iface: '0.0.0.0', port: 8386 },
                    location: { hostname: hostname, port: 8386 }
                }
            },
            dummy: {
                path: [ 'minikube/bin/router' ],
                workers: 3,
                properties: {
                    address: hostname,
                    bind: { iface: '0.0.0.0', port: 8080 },
                    diffuser: {
                        island: 'diffuser', id: configuration.id, isRouter: true, buckets: 13
                    }
                }
            }
        }
    }
}
