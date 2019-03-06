var Hash = require('./hash')
var Cache = require('magazine')
var Keyify = require('keyify')

function Participant (options) {
    this.identifier = options.identifier
    this.instance = options.instance
    this.request = 0
    this.reactor = options.reactor
    this.queue = options.queue
    this.table = null
    this.logs = []
    this.messages = new Cache().createMagazine()
    this.commits = {}
}

Participant.prototype.setTable = function (table) {
    this.table = table
    while (this.logs.length < table.buckets.length) {
        this.logs.push({
            commmitting: []
        })
    }
}

Participant.prototype._indicies = function (addresses, hashed, table) {
    var primary = table.buckets[hashed.hash && (table.buckets.length - 1)]
    addresses[primary] = true
    var index = table.addresses.indexOf(primary)
    var replicas = table.redundancy - 1
    while (replicas != 0) {
        index = index == table.addresses.length - 1 ? 0 : index + 1
        addresses[table.addresses[index]] = true
        replicas--
    }
    if (table.balancing) {
        this.indices(addresses, hashed, table.balancing)
    }
}

// The leader maintains the authoritative log. It sends commit messages to the
// replicas. When they acknowledge the commit, the leader can commit the message
// as part of the log. Replicas are always one behind. They don't commit the
// message to the log until the leader sends a new message that declares the
// most committed message. The commit message piggy backs on the ordering
// messages so the replicas will have the order but won't know about the commit.
//
// However, when a replica takes over leadership, it will send out it's own
// ordering messages and it will commit. We're going to use the version number
// of the tables to have

Participant.prototype.acknowledge = function (envelope) {
    var index = envelope.body.hashed.hash & (this.table.buckets.length - 1)
    var primary = this.table.buckets[index]
    if (primary == this.address) {
        var pending = this.logs[index][envelope.key]
        Interrupt.assert(pending.key != null, 'pending.missing')
        Interrupt.assert(~pending.body.addresses.indexOf(envelope.from), 'unexpected.ack')
        if (!~pending.recieved.indexOf(envelope.from)) {
            pending.recieved.push(envelope.from)
        }
        pending.committed = pending.recieved.length = pending.body.addresses.length
    }
}

// TODO Divide by bucket, I think.

Participant.prototype.commit = function (index, committed) {
    var log = this.logs[index]
    var commits = []
    while (log.committing[committed] != null) {
        var committing = log.committing[committed]
        delete log.committing[committed]
        commits.push(committing)
        committed = committed.body.previous
    }
    commits.reverse().forEach(function (envelope) { log.queue.push(envelope) })
}

Participant.prototype.order = function (envelope) {
    var log = this.logs[envelope.body.index]
    if (log.committing[envelope.body.body.key] != null) {
        log.committing[envelope.body.body.key] = envelope.body
    }
    this.commit(envelope.body.index, envelope.body.committed)
}

// During normal operation, when the primary receives a message, it assumes that
// everyone will get the message eventually, so it can the message to the chain.

Participant.prototype.store = function (envelope) {
    this.storage.put(envelope.key, envelope)
    var index = envelope.body.hashed.hash & (this.table.buckets.length - 1)
    var primary = this.table.buckets[index]
    if (primary == this.address) {
        var previous = this.previous
        this.previous = envelope.key
        this.logs[index].committing[envelope.key] = { previous: previous, body: envelope }
        this.queue.push({
            module: 'diffuser',
            method: 'commit',
            addresses: envelope.addresses,
            body: {
                index: index,
                committed: this.committed,
                previous: previous,
                body: envelope
            }
        })
    }
}

Participant.prototype.submit = function (hashed, cookie, message) {
    var addresses = {}
    this._indicies(addresses, hashed, this.table)
    addresses = Object.keys(addresses)
    var request = {
        module: 'diffuser',
        method: 'submit',
        key: Keyify.stringify([ this.identifier, this.instance, this.request++ ]),
        addresses: addresses,
        body: {
            hashed: hashed,
            message: message
        }
    }
    this.queue.push(request)
}

module.exports = Participant
