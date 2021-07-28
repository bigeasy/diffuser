const Turnstile = require('turnstile')
Turnstile.Queue = require('turnstile/queue')

const Reactor = require('reactor')

const Table = require('./table.redux')

const Cubbyhole = require('cubbyhole')

class Server {
    constructor (destructible, { ua, multipler = 2 }) {
        this._table = new Table(multipler)
        this._connections = new Set
        this._lookup = new Map
        this._snapshots = new Cubbyhole
        this._turnstile = new Turnstile(destructible.durable('turnstile'))
        this._queue = new Turnstile.Queue(this._turnstile, this._enqueue.bind(this))
        this._countdowns = new Map()
        this._ua = ua
        this._cubbyhole = new Cubbyhole
        this.reactor = new Reactor([{
            path: '/',
            method: 'get',
            f: this.index.bind(this)
        }, {
            path: '/receive',
            method: 'post',
            f: this.receive.bind(this)
        }])
    }

    async index () {
        return 'Diffuser API\n'
    }

    async initialize (compassion) {
        this._compassion = compassion
    }

    async bootstrap () {
    }

    async arrive ({ self: { arrived }, government, arrival: { promise } }) {
        this._countdowns.set(promise, new Set)
        this._table.arrive(arrived, promise)
        this._cubbyhole.resolve(promise, this._table.snapshot(promise))
        this._compassion.enqueue({
            module: 'diffuser',
            method: 'arrive',
            version: promise,
            diffuserId: arrived,
            connections: [ ...this._connections ]
        })
    }

    async acclimated ({ promise }) {
        this._cubbyhole.remove(promise)
    }

    async map (entry) {
        // TODO Rename to `request` to be consistent with `reduce`.
        const { request: { module, method } } = entry
        switch (`${module}/${method}`) {
        case 'diffuser/arrive': {
                const { self: { arrived }, request: { diffuserId, connections } } = entry
                for (const id of connections) {
                    this._table.set(hash(id), id, diffuserId)
                }
                return true
            }
            break
        case 'diffuser/connect': {
                const { self: { arrived }, request: { id, hashed, connectedTo } } = body
                if (this._table.has(arrived, hashed)) {
                    this._lookup.set(id, { hashed, connectedTo })
                }
                return true
            }
            break
        case 'diffuser/depart': {
                assert(this._departed != null)
                const { self: { arrived }, request: { departure, diffuserId, connetions } } = body
                if (this._deparated == departure) {
                    for (const id in connections) {
                        const hashed = hash(id)
                        if (this._table.has(arrived, hashed)) {
                            this._lookup[0].set(id, connections[id])
                        }
                    }
                }
            }
            break
        }
        return null
    }

    async reduce (entry) {
        const { request: { module, method } } = entry
        switch (`${module}/${method}`) {
        case 'diffuser/arrive': {
                const { government, from: { arrived }, request: { version } } = entry
                const countdown = this._countdowns.get(version)
                countdown.add(arrived)
                if (
                    countdown.size == government.majority.length +
                                      government.minority.length +
                                      government.constituents.length
                ) {
                    this._countdowns.delete(version)
                    this._table.complete(version)
                }
            }
            break
        case 'diffuser/connect': {
                const { cookie } = body
                const future = this._futures.get(cookie)
                if (future != null) {
                    future.resolve(true)
                    this._futures.delete(cookie)
                }
            }
            break
        case 'diffuser/depart': {
                const { government, request: { departure } } = body
                if (this._departure == departure) {
                    this._departures.add(diffuserId)
                    if (
                        this._departures.size == government.majority.length +
                                                 government.minority.length +
                                                 government.constituents.length
                    ) {
                        this._departure = null
                        this._departures.clear()
                    }
                }
            }
            break
        }
    }

    async depart ({ departure: { promise } }) {
        for (const set of this._countdowns.values()) {
            set.delete(promise)
        }
        this._cubbyhole.remove(promise)
        this._table.depart(promise)
        this._departure = promise
        this._departures.clear()
        const connetions = []
        for (const [ key, value ] of this._connections) {
            connections[key] = value
        }
        this._compassion.enqueue({
            module: 'diffuser',
            method: 'depart',
            diffuserId: self.arrival,
            connections: connections
        })
    }

    // We want to alleviate a race condition where we have a client
    // disconnecting and reconnecting to the same endpoint quickly and the
    // connect and disconnect messages are being handled by parallel HTTP
    // request handlers and the connect and disconnect are racing to get to the
    // lookup participant.
    async _enqueue ({ value: { future, id, method }, canceled }) {
        if (canceled) {
            future.resolve(false)
        }
        const hashed = hash(id)
        switch (method) {
        case 'connect': {
                const cookie = this._compassion.enqueue({
                    module: 'diffuser',
                    method: 'connect',
                    id: id,
                    hashed: hashed,
                    connectedTo: this._id
                })
                await this._futures.set(cookie, new Future).get(cookie).promise
                this._connections.add(id)
                future.resolve(true)
            }
            break
        case 'disconnect': {
                const cookie = this._compassion.enqueue({
                    module: 'diffuser',
                    method: 'disconnect',
                    id: id,
                    hashed: hashed,
                    connectedTo: this._id
                })
                await this._futures.set(cookie, new Future).get(cookie).promise
                this._connections.delete(id)
                future.resolve(true)
            }
            break
        }
    }

    async receive ({ body: { id, body } }) {
        if (! this._connections.has(id)) {
            const future = new Future
            this._queue.push({ future, id, body, method: 'connect' })
            if (! await future.promise) {
                return 503
            }
        }
        return await this._ua.server({ id, hashed, body })
    }

    async send ({ body: { id, body } }) {
        const hashed = hash(id)
        const storedAt = this._table.get(hashed)
        return await this._ua.lookup(storedAt, { id, body })
    }

    // Okay, now I'm remembering that things need to queue up somewhere and the
    // best place for them to queue up in the ingress, not egress and certainly
    // not right in the middle where we are fanning out, so this is simple.

    // Also the 404 shouldn't do anything. We should run the removal through
    // paxos. If we are afraid of blocking because we have one foot in a dead
    // participant, why worry? The dead participant ought to be causing all
    // sorts of trouble for the actual swath of participants, let's loop through
    // the lot until we get a 200 and continue to force the 404 so the candidate
    // can clean up.
    async lookup ({ body: { id, body } }) {
        const connectedTo = this._lookup.get(id)
        if (connectedTo == null) {
            return 404
        }
        const responses = []
        for (const [ key, value ] of this._lookup.get(id)) {
            responses.push(await this._ua.forward(connectedTo, { id, body }))
        }
        // Definitive yes.
        if (~responses.indexOf(200)) {
            return 200
        }
        // Suspicious no.
        if (~responses.indexOf(503)) {
            return 503
        }
        // Definitive no.
        return 404
    }

    async publish () {
        if (! this._connections.has(id)) {
            return 404
        }
        const response = await this._ua.tcp({ id, body })
        switch (response) {
        case 200: {
                return 200
            }
        case 503: {
                // Maybe just crash, but really wouldn't Kubernetes restart?
                return 503
            }
        case 404: {
                const future = new Future
                this._queue.push({ future, id, body, method: 'connect' })
                if (! await future.promise) {
                    return 503
                }
                return 404
            }
        }
        return 503
    }
}

module.exports = Server
