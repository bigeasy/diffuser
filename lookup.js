function Router (routes) {
    this.routes = routes
}

Router.prototype.route = function (hashed) {
    var promise = this.routes.buckets[hashed.hash % this.routes.buckets.length]
    var index = hashed.hash % this.routes.properties[promise].count
    return { promise: promise, index: index }
}

module.exports = Router
