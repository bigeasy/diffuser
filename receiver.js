var Procession = require('procession')
var cadence = require('cadence')

function Receiver (destructible, inbox) {
    this.inbox = new Procession
    this.outbox = new Procession
    this._inbox = inbox
    this.inbox.pump(this, '_eos', destructible.monitor('inbox'))
}

Receiver.prototype._eos = cadence(function (async, envelope) {
    if (envelope == null) {
        console.log('MUCH NULL!!!')
        this.outbox.push(null)
    } else {
        this._inbox.enqueue(envelope, async())
    }
})

module.exports = Receiver
