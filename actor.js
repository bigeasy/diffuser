function Actor (f) {
    this._f = f
}

// TODO Track a cookie.
Actor.prototype.act = function (client, envelope) {
    var result = this._f.call(null, envelope.body)
    if (result != null) {
        switch (result.method) {
        case 'respond':
            client.push({
                gatherer: envelope.gatherer,
                hashed: envelope.hashed,
                from: envelope.from,
                to: envelope.from,
                type: 'response',
                body: result.body
            })
            break
        case 'request':
            client.push({
                gatherer: envelope.gatherer,
                key: result.key,
                from: envelope.from,
                type: 'request',
                body: result.body
            })
            break
        }
    }
}

module.exports = Actor
