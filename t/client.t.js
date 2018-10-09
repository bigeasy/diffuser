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

    client.push({ to: { promise: '1/0', index: 0 } })
    okay(pushed, [{ to: { promise: '1/0', index: 0 } }], 'pushed')
}
