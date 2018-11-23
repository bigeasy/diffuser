var cadence = require('cadence')

var Consensus = require('./consensus')
var Conference = require('compassion.conference')
var Compassion = require('compassion.colleague/compassion')(Conference)

module.exports = cadence(function (destructible, olio, properties) {
    var consensus = new Consensus(properties.count)
    async(function () {
        destructible.monitor('compassion', Compassion, olio, consensus, 'island', 'first', {}, async())
    }, function (confernece) {
        consensus.confernece = confernece
        return consensus
    })
})
