var Router = require('./lookup')

function Registrar (options) {
    this._connector = options.connector
    this._registrations = Array.apply(null, new Array(options.buckets)).map(Object)
    this._index = options.index
}

Registrar.prototype.setRoutes = function (routes) {
    this._router = new Router(routes, this._index)
}

Registrar.prototype.register = function (hashed) {
    this._registrations[hashed.hash % this._registrations.length][hashed.stringified] = hashed
}

Registrar.prototype.contains = function (hashed) {
    return !! this._registrations[hashed.hash % this._registrations.length][hashed.stringified]
}

Registrar.prototype.unregister = function (hashed) {
    delete this._registrations[hashed.hash % this._registrations.length][hashed.stringified]
}

Registrar.prototype._transfer = function transfer (map) {
    for (var stringified in map) {
        var hashed = map[stringified]
        this._connector.push({
            module: 'diffuser',
            method: 'synchronize',
            from: this._router.from,
            to: this._router.route(hashed),
            promise: this._router.promise,
            body: hashed
        })
    }
}

Registrar.prototype.synchronize = function (from, routes) {
    if (this._router.event.action == 'arrive') {
        this._registrations.forEach(function (map, index) {
            if (this._router.buckets[index] == this._router.event.promise) {
                this._transfer(map)
            }
        }, this)
    } else {
        this._registrations.forEach(function (map, index) {
            for (var stringified in map) {
                this._transfer(map)
            }
        }, this)
    }
    for (var promise in this._router.properties) {
        var count = this._router.properties[promise].count
        for (var index = 0; index < count; index++) {
            this._connector.push({
                module: 'diffuser',
                method: 'synchronize',
                from: this._router.from,
                to: { promise: promise, index: count },
                promise: this._router.promise,
                body: null
            })
        }
    }
}

module.exports = Registrar
