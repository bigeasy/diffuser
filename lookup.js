function Router (buckets, counts) {
    this._buckets = buckets
    this._counts = counts
}

Router.prototype.route = function (hashed) {
    var promise = this._buckets[hashed.hash % this._buckets.length]
    var index = hashed.hash % this._counts[promise]
    return { promise: promise, index: index }
}

module.exports = Router
