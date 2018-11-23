var cadence = require('cadence')
var Turnstile = require('turnstile')
var restrictor = require('restrictor')

function Listener (destructible, olio) {
    this._olio = olio
    this.turnstile = new Turnstile
    this.turnstile.listen(destructible.monitor('socket'))
    destructible.destruct.wait(this.turnstile, 'destroy')
}

Listener.prototype.socket = restrictor.push(cadence(function (async, envelope) {
    if (!envelope.canceled) {
        var request = envelope.body.shift(), socket = envelope.body.shift()
        var message = {
            module: 'olio',
            method: 'connect',
            to: {
                name: request.headers['x-diffuser-to-name'],
                index: +request.headers['x-diffuser-to-index']
            }
        }
        this._olio.send(message.to.name, message.to.index, message, socket, async())
    }
}))

module.exports = cadence(function (async, destructible, olio, callback) {
    return new Listener(destructible, olio)
})
