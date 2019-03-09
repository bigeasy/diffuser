exports.configure = function (configuration) {
    return {
        socket: '/var/run/diffuser.socket',
        children: {
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
                    location: { hostname: '127.0.0.1', port: 8386 }
                }
            }
        }
    }
}
