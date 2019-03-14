var Monotonic = require('monotonic').asString
var logger = require('prolific.logger').createLogger('dummy')
var Cache = require('magazine')

function Tracker () {
    this._cookie = '0'
    this._requests = new Cache().createMagazine()
}

Tracker.prototype._complete = function (cartridge) {
    var complete = true
    for (var to in cartridge.value.events) {
        var events = cartridge.value.events[to]
        if (!(events.sent && events.routed)) {
            complete = false
        }
    }
    console.log('complete?', cartridge.value)
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
    var cartridge = this._requests.hold(this._cookie, {
        cookie: cookie,
        from: from,
        when: Date.now(),
        events: {}
    })
    addresses.forEach(function (to) {
        cartridge.value.events[to] = { routed: true }
        requests[to] = JSON.stringify({
            method: 'send',
            to: to,
            from: from,
            cookie: cookie
        }) + '\n'
    }, this)
    cartridge.release()
    return requests
}

Tracker.prototype.record = function (cookie, to, event) {
    var cartridge = this._requests.hold(cookie, null)
    if (cartridge.value == null) {
        logger.error('missing', { $message: message })
        cartridge.remove()
    } else {
        cartridge.value.events[to][event] = true
        this._complete(cartridge)
    }
}

Tracker.prototype.receive = function (to, message) {
    switch (message.method) {
    case 'route':
        this._tracker.record(cookie, to, 'routed')
        break
    }
}

// TODO Expire.

module.exports = Tracker
