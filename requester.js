var Router = require('./lookup')
var cadence = require('cadence')
var coalesce = require('extant')
var logger = require('prolific.logger').createLogger('diffuser')
var noop = require('nop')

var Monotonic = require('monotonic').asString

function Requester (options) {
    this._index = options.index
    this._cliffhanger = options.cliffhanger
    this._requests = options.requests
    this._Hash = options.Hash
    this._timeout = coalesce(options.timeout, 5000)
    this._connector = options.connector
    this._registrar = options.registrar
    this._cookie = '0'
}

Requester.prototype.setRoutes = function (routes) {
    this._router = new Router(routes, this._index)
}

Requester.prototype.expire = function () {
    var expired = Date.now() - this._timeout
    this._cliffhanger.expire(Date.now() - this._timeout, [ null, { status: 'timeout', values: null } ])
    var purge = this._requests.purge()
    while (purge.cartridge && purge.cartridge.when < expired) {
        var responses = purge.cartridge.value.responses.map(function (response) {
            return response || { status: 'timeout', values: null }
        })
        purge.cartridge.value.callback.call(null, null, false, responses)
        purge.cartridge.remove()
        purge.next()
    }
    purge.release()
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

Requester.prototype.route2 = function (destination, messages, context, callback) {
    var vargs = []
    vargs.push.apply(vargs, arguments)
    vargs.splice(0, 2)
    context = typeof vargs[0] == 'function' ? null : coalesce(vargs.shift())
    callback = coalesce(vargs.pop(), noop)
    if (!Array.isArray(messages)) {
        messages = [ messages ]
    }
    var cookie = this._cookie = Monotonic.increment(this._cookie, 0)
    this._requests.hold(cookie, {
        when: Date.now(),
        cookie: cookie,
        callback: callback,
        context: context,
        received: 0,
        responses: Array.apply(null, Array(messages.length)).map(function () { return null })
    }).release()
    messages.forEach(function (message, index) {
        var hashed = this._Hash.call(null, message.key)
        var to = this._router.route(hashed)
        this._connector.push({
            promise: this._router.promise,
            module: 'diffuser',
            destination: 'router',
            index: index,
            version: 2,
            method: destination == 'router' ? 'receive' : 'route',
            to: to,
            from: this._router.from,
            hashed: hashed,
            cookie: cookie,
            body: message.body,
            context: context
        })
    }, this)
}

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
