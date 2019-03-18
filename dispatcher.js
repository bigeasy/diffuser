var Monotonic = require('monotonic').asString
var Router = require('./lookup')
var Vivifyer = require('vivifyer')
var Countdown = require('./countdown')
var Procession = require('procession')
var assert = require('assert')

function Dispatcher (options) {
    this._index = options.index
    this._router = null
    this._backlogs = {
        synchronize: new Vivifyer(function () { return [] }),
        route: { queue: new Procession, shifter: null }
    }
    this._backlogs.route.shifter = this._backlogs.route.queue.shifter()
    this._router = null
    this._receiver = options.receiver
    this._countdown = new Countdown
    this._cliffhanger = options.cliffhanger
    assert(this._cliffhanger)
    this._registrations = Array.apply(null, new Array(options.buckets)).map(Object)
    this._registrar = options.registrar
    this._connector = options.connector
}

Dispatcher.prototype.setRoutes = function (routes) {
    this._router = new Router(routes, this._index)
    this._receiver.setRouter(this._router)
    this._countdown.start(routes)
    var backlog = this._backlogs.synchronize.get(routes.promise)
    this._backlogs.synchronize.remove(routes.promise)
    backlog.forEach(this.dispatch.bind(this))
}

Dispatcher.prototype._setRegistration = function (hashed, from) {
    this._registrations[hashed.hash % this._registrations.length][hashed.stringified] = from
}

Dispatcher.prototype.dispatch = function (envelope) {
    if (envelope == null) {
        return
    }
    var to
    assert(envelope.module == 'diffuser')
    assert(this._router == null || Router.compare(envelope.to, this._router.from) == 0)
    // We've not yet received a route from consensus, so let's pretend we didn't
    // even get this envelope yet. Note that envelopes will always be sent from a
    // specific peer with their route promises in ascending order.
    if (Monotonic.compare(envelope.promise, this._countdown.promise) > 0) {
        console.log('BACKLOG', envelope)
        if (envelope.method == 'synchronize') {
            this._backlogs.synchronize.get(envelope.promise).push(envelope)
        } else {
            this._backlogs.route.queue.push(envelope)
        }
    // We have a synchronize message and we're preparted to count it down.
    } else if (envelope.method == 'synchronize') {
        console.log('SYNC', envelope)
        // A null body indicates the end of stream of update messages.
        if (envelope.body == null) {
            this._countdown.arrive(envelope.promise, envelope.from)
            // We have heard from all our receiver friends regarding our latest
            // bucket table so we have been updated according to that table.
            if (this._countdown.count == 0) {
                // We play all the route backlogs.
                var backlog
                while ((backlog = this._backlogs.route.shifter.shift()) != null) {
                    this.dispatch(backlog)
                }
            }
        // Regardless of all that versioning guff above, we only have one bucket
        // table at a time and we only record a registration if the bucket
        // routes to ourselves.
        } else if (Router.compare(this._router.route(envelope.body), this._router.from) == 0) {
            this._setRegistration(envelope.body, envelope.from)
        }
    } else if (this._countdown.count != 0) {
        console.log('COUNTDOWN', envelope)
        this._backlogs.route.queue.push(envelope)
    // TODO No. We may have to reroute, right?
    } else if (
        envelope.destination == 'router' &&
        Router.compare(to = this._router.route(envelope.hashed), this._router.from) != 0
    ) {
        console.log('REROUTE (DREADED)', envelope)
        // TODO We should count hops and make sure we're not in a loop.
        envelope.promise = this._router.promise
        envelope.to = to
        console.log('REROUTE', envelope)
        this._connector.push(envelope)
    } else {
        switch (envelope.destination + '/' + envelope.method) {
        case 'router/register':
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
            this._receiver.act(this._connector, envelope)
            break
        case 'router/route':
            var registration = this._registrations[envelope.hashed.hash % this._registrations.length]
            var address = registration[envelope.hashed.stringified]
            if (address == null) {
                this._connector.push({
                    promise: this._router.promise,
                    module: 'diffuser',
                    destination: 'source',
                    method: 'respond',
                    hashed: envelope.hashed,
                    from: envelope.from,
                    to: envelope.from,
                    status: 'missing',
                    values: null,
                    cookie: envelope.cookie
                })
            } else {
                this._connector.push({
                    promise: this._router.promise,
                    module: 'diffuser',
                    destination: 'receiver',
                    method: 'receive',
                    hashed: envelope.hashed,
                    from: envelope.from,
                    to: address,
                    cookie: envelope.cookie,
                    body: envelope.body
                })
            }
            break
        case 'receiver/receive':
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
                    status: 'missing',
                    values: null,
                    cookie: envelope.cookie
                })
            }
            break
        case 'source/respond':
            this._cliffhanger.resolve(envelope.cookie, [ null, envelope ])
            break
        default:
            console.log('DROPPED', envelope)
            break
        }
    }
}

module.exports = Dispatcher
