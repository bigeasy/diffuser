var cadence = require('cadence')

function Diffuser () {
}

Diffuser.prototype.reconfigure = cadence(function (async) {
    return true
})

module.exports = cadence(function (destructible, olio, configuration) {
    async(function () {
    }, function () {
        return new Diffuser
    })
})
