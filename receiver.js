var Procession = require('procession')
var cadence = require('cadence')

function Receiver (destructible, inbox) {
    this.inbox = new Procession
    this.outbox = new Procession
    this._inbox = inbox
    var pump = this.inbox.pump(this, '_eos', destructible.monitor('inbox-eox-foo'))
    destructible.destruct.wait(pump, 'destroy')
}

Receiver.prototype._eos = cadence(function (async, envelope) {
    if (envelope == null) {
        this.outbox.push(null)
    } else {
        console.log('>', envelope)
        this._inbox.enqueue(envelope, async())
    }
})

module.exports = Receiver
