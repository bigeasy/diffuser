require('proof')(2, prove)

function prove (okay) {
    var Client = require('../client')

    var pushed = []
    var client = new Client({
        connect: function (to) {
            okay(to, { promise: '1/0', index: 0 }, 'connecting')
            return pushed
        }
    })

    client.setRoutes({ properties: { '1/0': {} } })
    client.push({ to: { promise: '1/0', index: 0 } })
    client.push({ to: { promise: '2/0', index: 0 } })
    okay(pushed, [{ to: { promise: '1/0', index: 0 } }], 'pushed')
}
