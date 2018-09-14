var Procession = require('procession')
var cadence = require('cadence')

function Sender (destructible, feedback) {
    this.outbox = new Procession
    this.inbox = new Procession
    this._feedback = feedback
    this.inbox.pump(this, '_eos', destructible.monitor('inbox'))
}

Sender.prototype._eos = cadence(function (async, envelope) {
    if (envelope == null) {
        this.outbox.push(null)
    } else {
        this._feedback.enqueue(envelope, async())
    }
})

module.exports = Sender
