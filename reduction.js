var Interrupt = require('interrupt').createInterrupter('diffuser')

function Reduction () {
    this._operations = {}
}

Reduction.prototype.operation = function (version, addresses) {
    this._operations[version] = addresses.slice()
}

Reduction.prototype.complete = function (version, address) {
    var operation = this._operations[version]
    var index = operation.indexOf(address)
    Interrupt.assert(index != -1, 'operation.missing')
    operation.splice(index, 1)
    if (operation.length == 0) {
        delete this._operations[version]
        return true
    }
    return false
}

module.exports = Reduction
