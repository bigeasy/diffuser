var Hash = require('./hash')

function Counter (router, count) {
    this._router = router
    this._count = count
    this._arrived = []
}

Counter.prototype.arrived = function (arrival) {
    if (!~this._arrived.indexOf(arrival.address)) {
        arrival.identifiers.forEach(function (identifier) {
            this._router.set(Hash(identifier), arrival.address)
        }, this)
        this._arrived.push(arrival.address)
        if (this._arrived.length === this._count) {
            return true
        }
    }
    return false
}

module.exports = Counter
