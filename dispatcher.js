var Monotonic = require('monotonic').asString
var Router = require('./lookup')
var Vivifyer = require('vivifyer')
var Countdown = require('./countdown')
var Procession = require('procession')
var assert = require('assert')
var logger = require('prolific.logger').createLogger('diffuser')

var coalesce = require('extant')

var Interrupt = require('interrupt').createInterrupter('diffuser')

function Dispatcher (options) {
    this._index = options.index
    this._router = null
    this._backlog = { queue: new Procession, shifter: null }
    this._backlog.shifter = this._backlog.queue.shifter()
    this._router = null
    this._receiver = options.receiver
    this._countdown = new Countdown
    this._cliffhanger = options.cliffhanger
    this._requests = options.requests
    assert(this._cliffhanger)
    this._registrations = Array.apply(null, new Array(options.buckets)).map(Object)
    this._registrar = options.registrar
    this._connector = options.connector
    this._series = {}
}

Dispatcher.prototype.setRoutes = function (routes) {
    this._router = new Router(routes, this._index)
    this._receiver.setRouter(this._router)
    this._countdown.start(routes)
    this._playBacklog()
    if (routes.event.action == 'depart') {
        delete this._series[routes.promise]
    }
}

Dispatcher.prototype._setRegistration = function (hashed, from) {
    this._registrations[hashed.hash % this._registrations.length][hashed.stringified] = from
}

Dispatcher.prototype.receive = function (envelope) {
    if (envelope != null) {
        var series = this._series[envelope.via.promise]
        if (series == null) {
            series = this._series[envelope.via.promise] = []
        }
        var counters = series[envelope.via.index]
        if (counters == null) {
            counters = series[envelope.via.index] = {
                received: 0xffffffff,
                dispatched: 0xffffffff
            }
        }
        Interrupt.assert(envelope.series == counters.received, 'bad.receive.series', {
            envelope: envelope,
            series: this._series,
            counters: counters
        })
        if (counters.received == 0xffffffff) {
            counters.received = 0
        } else {
            counters.received++
        }
        this._dispatch(envelope)
    }
}

Dispatcher.prototype._dispatched = function (envelope, counters) {
    Interrupt.assert(envelope.series == counters.dispatched, 'bad.dispatch.series', {
        envelope: envelope,
        counters: counters
    })
    if (counters.dispatched == 0xffffffff) {
        counters.dispatched = 0
    } else {
        counters.dispatched++
    }
}

Dispatcher.prototype._playBacklog = function () {
    var backlog
    var shifter = this._backlog.shifter
    this._backlog = { queue: new Procession, shifter: null }
    this._backlog.shifter = this._backlog.queue.shifter()
    while ((backlog = shifter.shift()) != null) {
        this._dispatch(backlog)
    }
}

Dispatcher.prototype._dispatch = function (envelope) {
    if (envelope == null) {
        return
    }
    var counters = this._series[envelope.via.promise][envelope.via.index]
    var to
    var action = null
    assert(envelope.module == 'diffuser')
    assert(this._router == null || Router.compare(envelope.to, this._router.from) == 0)
    // We've not yet received a route from consensus, so let's pretend we didn't
    // even get this envelope yet. Note that envelopes will always be sent from a
    // specific peer with their route promises in ascending order.
    if (Monotonic.compare(envelope.promise, this._countdown.promise) > 0) {
        action = 'backlog'
        this._backlog.queue.push(envelope)
    // We have a synchronize message and we're preparted to count it down.
    } else if (envelope.method == 'synchronize') {
        this._dispatched(envelope, counters)
        action = 'sync'
        // A null body indicates the end of stream of update messages.
        if (envelope.body == null) {
            this._countdown.arrive(envelope.promise, envelope.from)
            // We have heard from all our receiver friends regarding our latest
            // bucket table so we have been updated according to that table.
            if (this._countdown.count == 0) {
                // We play all the route backlogs.
                this._playBacklog()
            }
        // Regardless of all that versioning guff above, we only have one bucket
        // table at a time and we only record a registration if the bucket
        // routes to ourselves.
        } else if (Router.compare(this._router.route(envelope.body), this._router.from) == 0) {
            this._setRegistration(envelope.body, envelope.from)
        }
    } else if (this._countdown.count != 0) {
        action = 'countdown'
        this._backlog.queue.push(envelope)
    // TODO No. We may have to reroute, right?
    } else if (
        envelope.destination == 'router' &&
        Router.compare(to = this._router.route(envelope.hashed), this._router.from) != 0
    ) {
        this._dispatched(envelope, counters)
        action = 'reroute'
        // TODO We should count hops and make sure we're not in a loop.
        envelope.promise = this._router.promise
        envelope.to = to
        console.log('REROUTE', envelope)
        this._connector.push(envelope)
    } else {
        this._dispatched(envelope, counters)
        switch (envelope.destination + '/' + envelope.method) {
        case 'router/register':
            action = 'register'
            envelope.got = true
            this._setRegistration(envelope.hashed, envelope.from)
            this._connector.push({
                promise: this._router.promise,
                module: 'diffuser',
                destination: 'source',
                method: 'respond',
                hashed: envelope.hashed,
                from: envelope.from,
                to: envelope.from,
                status: 'received',
                cookie: envelope.cookie
            })
            break
        case 'router/unregister':
            action = 'unregister'
            var registration = this._registrations[envelope.hashed.hash % this._registrations.length]
            var exists = !! registration[envelope.hashed.stringified], deleted = false
            if (exists && Router.compare(registration[envelope.hashed.stringified], envelope.from) == 0) {
                delete registration[envelope.hashed.stringified]
                deleted = true
            }
            this._connector.push({
                promise: this._router.promise,
                module: 'diffuser',
                destination: 'source',
                method: 'respond',
                hashed: envelope.hashed,
                from: envelope.from,
                to: envelope.from,
                status: 'received',
                cookie: envelope.cookie,
                body: { exists: exists, deleted: deleted }
            })
            break
        case 'router/receive':
            action = 'receive'
            this._receiver.act(this._connector, envelope)
            break
        case 'router/route':
            action = 'route'
            var registration = this._registrations[envelope.hashed.hash % this._registrations.length]
            var address = registration[envelope.hashed.stringified]
            if (address == null) {
                this._connector.push({
                    promise: this._router.promise,
                    module: 'diffuser',
                    destination: 'source',
                    method: 'respond',
                    version: coalesce(envelope.version),
                    index: coalesce(envelope.index),
                    hashed: envelope.hashed,
                    from: envelope.from,
                    to: envelope.from,
                    status: 'missing',
                    values: null,
                    cookie: envelope.cookie,
                    context: envelope.context
                })
            } else {
                this._connector.push({
                    promise: this._router.promise,
                    module: 'diffuser',
                    destination: 'receiver',
                    method: 'receive',
                    hashed: envelope.hashed,
                    version: coalesce(envelope.version),
                    index: coalesce(envelope.index),
                    from: envelope.from,
                    to: address,
                    cookie: envelope.cookie,
                    body: envelope.body,
                    context: envelope.context
                })
            }
            break
        case 'receiver/receive':
            action = 'receiver'
            if (this._registrar.contains(envelope.hashed)) {
                this._receiver.act(this._connector, envelope)
            } else {
                this._connector.push({
                    promise: this._router.promise,
                    module: 'diffuser',
                    destination: 'source',
                    method: 'respond',
                    hashed: envelope.hashed,
                    from: envelope.from,
                    to: envelope.from,
                    version: coalesce(envelope.version),
                    index: coalesce(envelope.index),
                    status: 'missing',
                    values: null,
                    cookie: envelope.cookie,
                    context: envelope.context
                })
            }
            break
        case 'source/respond':
            action = 'respond'
            if (envelope.version == 2) {
                var cartridge = this._requests.hold(envelope.cookie, null)
                if (cartridge.value == null) {
                    logger.trace('request.timedout', {
                        key: envelope.key,
                        context: envelope.context
                    })
                    cartridge.release()
                } else {
                    Interrupt.assert(cartridge.value.responses[envelope.index] == null, 'response.duplicate', {
                        $envelope: envelope
                    })
                    var now = Date.now()
                    cartridge.value.responses[envelope.index] = {
                        status: envelope.status,
                        values: coalesce(envelope.values, null)
                    }
                    logger.trace('response.complete', {
                        metric: true,
                        component: 'dispatcher',
                        duration: now - cartridge.value.when,
                        status: envelope.status,
                        from: envelope.from.promise + '[' + envelope.from.index + ']',
                        to: envelope.from.promise + '[' + envelope.to.index + ']',
                        context: cartridge.value.context
                    })
                    if (++cartridge.value.received == cartridge.value.responses.length) {
                        var successful = cartridge.value.responses.filter(function (response) {
                            return response.status != 'received'
                        }).length == 0
                        logger.trace('request.complete', {
                            metric: true,
                            component: 'dispatcher',
                            successful: successful,
                            duration: now - cartridge.value.when,
                            from: envelope.from.promise + '[' + envelope.from.index + ']',
                            context: cartridge.value.context
                        })
                        cartridge.value.callback.call(null, null, successful, cartridge.value.responses)
                        cartridge.remove()
                    } else {
                        cartridge.release()
                    }
                }
            } else {
                this._cliffhanger.resolve(envelope.cookie, [ null, envelope ])
            }
            break
        default:
            action = 'drop'
            break
        }
    }
    logger.trace('dispatch', {
        component: 'dispatcher',
        action: 'action',
        $envelope: envelope
    })
}

module.exports = Dispatcher
