function Actor (f) {
    this._f = f
}

// TODO Track a cookie.
Actor.prototype.act = function (Hash, client, envelope) {
    var result = this._f.call(null, envelope.body)
    if (result != null) {
        switch (result.method) {
        case 'respond':
            client.push({
                gatherer: envelope.gatherer,
                from: envelope.from,
                to: envelope.from,
                type: 'response',
                body: result.body
            })
            break
        case 'request':
            client.push({
                gatherer: envelope.gatherer,
                from: envelope.from,
                key: result.key,
                type: 'request',
                body: result.body
            })
            break
        }
    }
}
