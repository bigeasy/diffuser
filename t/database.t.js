require('proof')(5, prove)

function prove (okay) {
    var hashes = ([ 0, 1, 2, 3 ]).map(function (value) {
        return { hash: value, stringified: String(value), key: value }
    })
    var Hash = require('../hash')
    var Database = require('../database')
    var database = new Database('a')
    database.get(Hash(1), function (error, value) {
        okay(value, null, 'nothing')
    })
    database.setBuckets([ 'a', 'b', 'a', 'a', 'b', 'b', 'a' ])
    database.set(hashes[0], 0)
    database.set(hashes[1], 1)
    database.get(hashes[0], function (error, value) {
        okay(value, 0, 'found')
    })
    database.get(hashes[1], function (error, value) {
        okay(value, null, 'empty')
    })
    database.get(hashes[2], function (error, value) {
        okay(/^diffuser#unrouted$/m.test(error.message), 'dropped')
    })
    database.get(hashes[3], function (error, value) {
        okay(value, null, 'missing')
    })
    database.setBuckets([ 'a', 'b', 'c', 'a', 'b', 'b', 'a' ])
    database.ready()
}
