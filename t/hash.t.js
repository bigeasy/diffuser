require('proof')(1, prove)

function prove (okay) {
    var Hash = require('../hash')
    okay(Hash(1), { hash: 873244444, stringified: '1', key: 1 }, 'hash')
}
