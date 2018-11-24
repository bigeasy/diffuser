var cadence = require('cadence')

var Consensus = require('./consensus')
var Conference = require('compassion.conference')
var Compassion = require('compassion.colleague/compassion')(Conference)

function Listener () {
}

var Initializer = require('./initializer')

module.exports = cadence(function (async, destructible, olio, properties) {
    var consensus = new Consensus(properties.count)
    async(function () {
        destructible.monitor('initializer', Initializer, olio, async())
    }, function () {
        destructible.monitor('compassion', Compassion, olio, consensus, 'island', 'first', {}, async())
    }, function (confernece) {
        console.log('fooooed!')
        consensus.confernece = confernece
        return consensus
    })
})
