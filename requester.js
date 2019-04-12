var Router = require('./lookup')
var cadence = require('cadence')
var coalesce = require('extant')
var logger = require('prolific.logger').createLogger('diffuser')

function Requester (options) {
    this._index = options.index
    this._cliffhanger = options.cliffhanger
    this._Hash = options.Hash
    this._timeout = coalesce(options.timeout, 5000)
    this._connector = options.connector
    this._registrar = options.registrar
}

Requester.prototype.setRoutes = function (routes) {
    this._router = new Router(routes, this._index)
}

Requester.prototype.expire = function () {
    this._cliffhanger.expire(Date.now() - this._timeout, [ null, { status: 'timeout', values: null } ])
}

Requester.prototype.register = cadence(function (async, key, context) {
    var hashed = this._Hash.call(null, key)
    this._registrar.register(hashed)
    var start = Date.now()
    async(function () {
        this._connector.push({
            promise: this._router.promise,
            module: 'diffuser',
            destination: 'router',
            method: 'register',
            to: this._router.route(hashed),
            from: this._router.from,
            hashed: hashed,
            cookie: this._cliffhanger.invoke(async())
        })
    }, function (response) {
        logger.trace('register', {
            component: 'requester',
            status: response.status,
            duration: Date.now() - start,
            context: coalesce(context)
        })
        return response.status == 'received'
    })
})

Requester.prototype.unregister = cadence(function (async, key, context) {
    var hashed = this._Hash.call(null, key)
    this._registrar.unregister(hashed)
    var start = Date.now()
    async(function () {
        this._connector.push({
            promise: this._router.promise,
            module: 'diffuser',
            destination: 'router',
            method: 'unregister',
            to: this._router.route(hashed),
            from: this._router.from,
            hashed: hashed,
            cookie: this._cliffhanger.invoke(async())
        })
    }, function (response) {
        logger.trace('unregister', {
            component: 'requester',
            status: response.status,
            duration: Date.now() - start,
            context: coalesce(context)
        })
        return response.status == 'received'
    })
})

Requester.prototype.route = cadence(function (async, destination, key, value) {
    var hashed = this._Hash.call(null, key)
    var method = destination == 'router' ? 'receive'  : 'route'
    var to = this._router.route(hashed)
    var start = Date.now()
    async(function () {
        this._connector.push({
            promise: this._router.promise,
            module: 'diffuser',
            destination: 'router',
            method: method,
            to: to,
            from: this._router.from,
            hashed: hashed,
            cookie: this._cliffhanger.invoke(async()),
            body: value
        })
    }, function (response) {
        logger.trace('route', {
            component: 'requester',
            status: response.status,
            duration: Date.now() - start,
            context: coalesce(value.context)
        })
        return { status: response.status, values: response.values }
    })
})

module.exports = Requester
