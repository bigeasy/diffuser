function Router (routes) {
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

module.exports = Router
