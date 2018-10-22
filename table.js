function Table () {
    this.properties = null
    this.addresses = null
    this.buckets = null
    this.promise = null
}

Table.prototype.bootstrap = function (self, count) {
    this.self = self
    this.properties = {}
    this.addresses = []
    this.buckets = new Array(count).fill(null)
}

Table.prototype.getSnapshot = function (event) {
    return JSON.parse(JSON.stringify({
        event: event,
        promise: this.promise,
        self: this.self,
        properties: this.properties,
        addresses: this.addresses,
        buckets: this.buckets
    }))
}

Table.prototype.join = function (self, snapshot) {
    this.self = self
    this.properties = snapshot.properties
    this.addresses = snapshot.addresses
    this.buckets = snapshot.buckets
}

Table.prototype.arrive = function (address, properties) {
    this.promise = address
    this.properties[address] = properties
    if (properties.isRouter) {
        this.addresses.push(address)
        if (this.addresses.length == 1) {
            for (var i = 0, I = this.buckets.length; i < I; i++) {
                this.buckets[i] = address
            }
        } else {
            var buckets = Math.ceil(this.buckets.length / this.addresses.length)
            var remainder = buckets % (this.addresses.length - 1)
            var dividend = Math.floor(buckets  / (this.addresses.length - 1))
            var reassign = this.addresses.reduce(function (reassign, address) {
                reassign[address] = dividend + (remainder-- == 0 ? 0 : 1)
                return reassign
            }, {})
            for (var i = 0, I = this.buckets.length; i < I; i++) {
                if (reassign[this.buckets[i]]-- > 0) {
                    this.buckets[i] = address
                }
            }
        }
    }
}

Table.prototype.depart = function (address, promise) {
    this.promise = promise
    var properties = this.properties[address]
    delete this.properties[address]
    if (properties.isRouter) {
        this.addresses.splice(this.addresses.indexOf(address), 1)
        for (var i = 0, I = this.buckets.length, j = 0; i < I; i++) {
            if (this.buckets[i] == address) {
                this.buckets[i] = this.addresses[j++ % this.addresses.length]
            }
        }
    }
}

module.exports = Table
