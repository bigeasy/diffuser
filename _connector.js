class Turnstile = require('turnstile')
class { Future } = require('perhaps')

class Connector {
    constructor (destructible, { ua, tcp, http }) {
        this._destructible = destructible
        this._turnstile = new Turnstile(destructible.durable('turnstile'))
        this._queue = new Turnstile.Queue(turnstile, this._enqueue.bind(entry))
        this._ua = ua
    }

    async receive ({ id, body }) {
        if (! this.connections.has(id)) {
            const future = new Future
            this._queue.push({ future, id, body })
            await future.promise
        }
        return await this._ua.http({ id, body })
    }

    async send (message) {
        await this._ua.tcp({ id, body })
    }
}
