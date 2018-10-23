var Router = require('./lookup')
var cadence = require('cadence')

function Requester (options) {
    this._configuration = options.configuration
    this._cliffhanger = options.cliffhanger
    this._Hash = options.Hash
    this._from = options.from
    this._timeout = coalesce(options.timeout)
}

Requester.prototype.setRoutes = function (routes) {
    this._router = new Router(routes)
}

Requester.prototype.expire = function () {
    this._cliffhanger.expire(Date.now() - this._timeout, [ null, { status: 'timeout' } ])
}

Requester.prototype.register = cadence(function (async, key) {
    var hashed = this._Hash.call(null, key)
    this._registrar.register(hashed)
    async(function () {
        this._client.push({
            promise: this._router.promise,
            destination: 'router',
            method: 'register',
            gatherer: null,
            to: this._router.route(hashed),
            from: this._configuration.from,
            hashed: hashed,
            cookie: this._cliffhanger.invoke(async())
        })
    }, function (response) {
        return response.status == 'received'
    })
})

Requester.prototype.unregister = cadence(function (async, key) {
    var hashed = this._Hash.call(null, key)
    this._registrar.unregister(hashed)
    async(function () {
        this._client.push({
            promise: this._router.promise,
            destination: 'router',
            method: 'unregister',
            to: this._router.route(hashed),
            from: this._configuration.from,
            hashed: hashed,
            cookie: this._cliffhanger.invoke(async())
        })
    }, function (response) {
        return response.status == 'received'
    })
})

Requester.prototype.route = cadence(function (async, destination, key, value) {
    var hashed = this._Hash.call(null, key)
    async(function () {
        this._client.push({
            promise: this._router.promise,
            destination: destination,
            method: 'route',
            hashed: hashed,
            to: this._router.route(hashed),
            body: value,
            from: this._configuration.from,
            cookie: this._cliffhanger.invoke(async())
        })
    }, function (response) {
        return { status: response.status, values: response.values }
    })
})

module.exports = Requester
