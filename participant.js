var Hash = require('./hash')

function Participant (options) {
    this.identifier = options.identifier
    this.instance = options.instance
    this.request = 0
    this.reactor = options.reactor
    this.queue = options.queue
    this.table = null
    this.balancing = []
}

Participant.prototype.setTable = function (table) {
    this.table = table
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

Participant.prototype.submit = function (hashed, cookie, message) {
    var addresses = {}
    this._indicies(addresses, hashed, this.table)
    addresses = Object.keys(addresses)
    var request = {
        module: 'diffuser',
        method: 'submit',
        key: [ this.identifier, this.instance, this.request++ ],
        addresses: addresses,
        body: {
            hashed: hashed,
            message: message
        }
    }
    this.queue.push(request)
}

module.exports = Participant
