function Router (routes) {
    this._routes = routes
}

Router.prototype.route = function (hashed) {
    var promise = this._routes.buckets[hashed.hash % this._routes.buckets.length]
    var index = hashed.hash % this._routes.properties[promise].count
    return { promise: promise, index: index }
}

module.exports = Router
