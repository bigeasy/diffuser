var Monotonic = require('monotonic').asString
var logger = require('prolific.logger').createLogger('dummy')
var Cache = require('magazine')

function Tracker () {
    this._cookie = '0'
    this._requests = new Cache().createMagazine()
}

Tracker.prototype._complete = function (cartridge) {
    if (cartridge.value.sent && cartridge.value.routed) {
        console.log('COMPLETE!!!', cartridge.value)
        logger.info('complete', {})
        cartridge.remove()
    } else {
        cartridge.release()
    }
}

Tracker.prototype.request = function (to, from) {
    var cookie = this._cookie = Monotonic.increment(this._cookie, 0)
    this._requests.hold(this._cookie, {
        cookie: cookie,
        to: to,
        from: from,
        when: Date.now(),
        routed: true
    }).release()
    return cookie
}

Tracker.prototype.record = function (cookie, event) {
    var cartridge = this._requests.hold(cookie, null)
    console.log('cartridge', cartridge.value)
    if (cartridge.value == null) {
        logger.error('missing', { $message: message })
        cartridge.remove()
    } else {
        cartridge.value[event] = true
        this._complete(cartridge)
    }
}

Tracker.prototype.receive = function (message) {
    switch (message.method) {
    case 'route':
        this._tracker.record(cookie, 'routed')
        break
    }
}

// TODO Expire.

module.exports = Tracker
