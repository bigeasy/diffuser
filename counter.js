var Monotonic = require('monotonic').asString

function Counter () {
    this._counts = {}
}

Counter.prototype.increment = function (promise) {
    if (this._counts[promise] == null) {
        return this._counts[promise] = 1
    }
    return ++this._counts[promise]
}

Counter.prototype.updated = function (promise) {
    var promises = Object.keys(this._counts).sort(Monotonic.compare)
    while (promises.length && Monotonic.compare(promises[0], promise) <= 0) {
        delete this._counts[promises.shift()]
    }
}

module.exports = Counter
