var Monotonic = require('monotonic').asString

function Router (routes, index) {
    this.from = { promise: routes.self, index: index }
    this.self = routes.self
    this.promise = routes.promise
    this.properties = routes.properties
    this.event = routes.event
    this.buckets = routes.buckets
}

Router.prototype.route = function (hashed) {
    var promise = this.buckets[hashed.hash % this.buckets.length]
    var index = hashed.hash % this.properties[promise].count
    return { promise: promise, index: index }
}

Router.compare = function (left, right) {
    var compare = Monotonic(left.promise, right.promise)
    if (compare == 0) {
        return compare
    }
    return left.index - right.index
}

module.exports = Router
