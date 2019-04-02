var Monotonic = require('monotonic').asString
var logger = require('prolific.logger').createLogger('dummy')
var Cache = require('magazine')
var cadence = require('cadence')

function Tracker () {
    this._cookie = '0'
    this._requests = new Cache().createMagazine()
}

Tracker.prototype._complete = function (cartridge) {
    var complete = true
    for (var to in cartridge.value.events) {
        var events = cartridge.value.events[to]
        if (!(events.received && events.routed)) {
            complete = false
        }
    }
    if (complete) {
        console.log('COMPLETE!!!', cartridge.value)
        logger.info('complete', {})
        cartridge.remove()
    } else {
        cartridge.release()
    }
}

Tracker.prototype.request = function (from, addresses) {
    var requests = {}, cookie = this._cookie = Monotonic.increment(this._cookie, 0)
    var cartridge = this._requests.hold(cookie, {
        cookie: cookie,
        from: from,
        when: Date.now(),
        events: {}
    })
    addresses.forEach(function (to) {
        cartridge.value.events[to] = {}
        requests[to] = {
            method: 'send',
            to: to,
            from: from,
            cookie: cookie
        }
    }, this)
    cartridge.release()
    return requests
}

Tracker.prototype.record = function (cookie, to, event) {
    console.log('recording', { cookie: cookie, to: to, event: event })
    var cartridge = this._requests.hold(cookie, null)
    if (cartridge.value == null) {
        logger.error('missing', { cookie: cookie, to: to, event: event })
        cartridge.remove()
    } else {
        cartridge.value.events[to.address][event] = true
        this._complete(cartridge)
    }
}

Tracker.prototype.receive = cadence(function (async, message) {
    console.log('GOT!', message)
    switch (message.method) {
    case 'route':
        this.record(message.cookie, message.from, 'routed')
        break
    }
    return []
})

Tracker.prototype.expire = function () {
    var expired = Date.now() - 5000
    var purge = this._requests.purge()
    while (purge.cartridge && purge.cartridge.when < expired) {
        console.log('EXPIRED!', purge.cartridge.value)
        purge.cartridge.remove()
        purge.next()
    }
    purge.release()
}

module.exports = Tracker
