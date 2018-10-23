var Router = require('./lookup')

function Registrar (options) {
    this._configuration = options.configuration
    this._client = options.client
    this._locations = Array.apply(null, new Array(options.buckets)).map(Object)
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

function transfer (router, client, map) {
    for (var stringified in map) {
        var hashed = map[stringified]
        this._client.push({
            module: 'diffuser',
            method: 'synchronize',
            to: this._router.route(hashed),
            from: this._router.from,
            promise: this._router.promise,
            body: hashed
        })
    }
}

Registrar.prototype.synchronize = function (from, routes) {
    if (routes.event.action == 'arrive') {
        this._registrations.forEach(function (map, index) {
            if (routes.buckets[index] == routes.event.promise) {
                this._transfer(map)
            }
        })
    } else {
        this._registrations.forEach(function (map, index) {
            for (var stringified in map) {
                this._transfer(map)
            }
        })
    }
    for (var promise in routes.properties) {
        var count = routes.properties[promise].count
        for (var index = 0; index < count; index++) {
            this._client.push({
                from: this._router.from,
                to: { promise: promise, index: count },
                module: 'diffuser',
                method: 'synchronize',
                promise: this._routes.promise,
                body: null
            })
        }
    }
}

module.exports = Registrar
