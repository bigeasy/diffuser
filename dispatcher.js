var Monotonic = require('monotonic').asString
var Router = require('./lookup')
var Vivifyer = require('vivifyer')
var Countdown = require('./countdown')
var Procession = require('procession')
var assert = require('assert')
var RBTree = require('bintrees').RBTree

function Dispatcher (options) {
    this._index = options.index
    this._router = null
    this._backlogged = new RBTree(Monotonic.compare)
    this._backlogs = {
        synchronize: new Vivifyer(function () { return [] }),
        route: { queue: new Procession, shifter: null }
    }
    this._backlogs.route.shifter = this._backlogs.route.queue.shifter()
    this._router = { dirty: true }
    this._countdown = new Countdown
    this._synchronized = '0/0'
    this._registrations = Array.apply(null, new Array(options.buckets)).map(Object)
    this._registrar = options.registrar
}

Dispatcher.prototype.setRoutes = function (routes) {
    this._router = new Router(routes)
    this._countdown.start(routes)
    var backlog = this._backlogs.synchronize.get(routes.promise)
    this._backlogs.synchronize.remove(routes.promise)
    backlog.forEach(this.dispatch.bind(this))
}

Dispatcher.prototype._setRegistration = function (hashed, from) {
    this._registrations[hashed.hash % this._registrations.length][hashed.stringified] = from
}

Dispatcher.prototype.dispatch = function (envelope) {
    assert(envelope.module == 'diffuser')
    assert(envelope.to.promise == this._router.self && envelope.to.index == this._index)
    // We've not yet received a route from consensus, so let's pretend we didn't
    // even get this envelope yet. Note that envelopes will always be sent from a
    // specific peer with their route promises in ascending order.
    if (Monotonic.compare(envelope.promise, this._countdown.promise) > 0) {
        if (envelope.method == 'synchronize') {
            this._backlogs.synchronize.get(envelope.promise).push(envelope)
        } else {
            this._backlogs.route.queue.push(envelope)
        }
    // We have a synchronize message and we're preparted to count it down.
    } else if (envelope.method == 'synchronize') {
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
        } else if (Router.compare(this._router.route(envelope.hashed), this._self) == 0) {
            this._setRegistration(envelope.hashed, envelope.from)
        }
    } else if (this._countdown.count != 0) {
        this._backlogs.route.queue.push(envelope)
    } else {
        assert(Router.compare(this._router.route(envelope.hashed), this._self) == 0)
        switch (envelope.destination + '/' + envelope.method) {
        case 'router/register':
            this._setRegistration(envelope.hashed, envelope.from)
            client.push({
                module: 'diffuser',
                method: 'respond',
                destination: 'source',
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
            if (registration[envelope.hashed.stringified] == envelope.from) {
                delete registration[envelope.hashed.stringified]
                deleted = true
            }
            client.push({
                module: 'diffuser',
                method: 'respond',
                destination: 'source',
                hashed: envelope.hashed,
                from: envelope.from,
                to: envelope.from,
                status: 'received',
                cookie: envelope.cookie,
                body: { exists: exists, deleted: deleted }
            })
            break
        case 'router/route':
            this._visit.act(envelope)
            break
        case 'receiver/route':
            var registration = this._registrations[envelope.hashed.hash % this._registrations.length]
            var address = registration[envelope.hashed.stringified]
            if (address == null) {
                client.push({
                    module: 'diffuser',
                    method: 'respond',
                    destination: 'source',
                    hashed: envelope.hashed,
                    from: envelope.from,
                    to: envelope.from,
                    status: 'missing',
                    cookie: envelope.cookie,
                    body: null
                })
            } else {
                client.push({
                    module: 'diffuser',
                    method: 'receive',
                    destination: 'receiver',
                    hashed: envelope.hashed,
                    from: envelope.from,
                    to: address,
                    cookie: envelope.cookie,
                    body: envelope.body
                })
            }
            break
        case 'receiver/recieve':
            if (this._registrar.contains(envelope.hashed)) {
                this._receive.act(envelope)
            }
            break
        case 'receiver/respond':
            this._cliffhanger.resolve(envelope.cookie, [ null, envelope ])
            break
        }
    }
}

module.exports = Dispatcher
