var Procession = require('procession')

function Sender (feedback) {
    this.outbox = new Procession
    this.inbox = feedback
}

module.exports = Sender
