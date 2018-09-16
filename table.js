function Table () {
    this.addresses = null
    this.buckets = null
}

Table.prototype.bootstrap = function (count) {
    this.addresses = []
    this.buckets = new Array(count).fill(null)
}

Table.prototype.join = function (addresses, buckets) {
    this.addresses = addresses
    this.buckets = buckets
}

Table.prototype.arrive = function (address) {
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

Table.prototype.depart = function (address) {
    this.addresses.splice(this.addresses.indexOf(address), 1)
    for (var i = 0, I = this.buckets.length, j = 0; i < I; i++) {
        if (this.buckets[i] == address) {
            this.buckets[i] = this.addresses[j++ % this.addresses.length]
        }
    }
}

module.exports = Table
