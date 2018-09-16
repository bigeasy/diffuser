var UserAgent = require('vizsla')
var Monotonic = require('monotonic').asString

var cadence = require('cadence')

var logger = require('prolific.logger').createLogger('diffuser')
var coalesce = require('extant')

function Discoverer (caller) {
    this._caller = caller
    this._ua = new UserAgent
}

Discoverer.prototype.discover = cadence(function (async) {
    async(function () {
        this._caller.invoke({}, async())
    }, function (addresses) {
        async.map(function (url) {
            async([function () {
                this._ua.fetch({
                    url: url
                }, {
                    url: '/routes',
                    raise: true,
                    parse: 'json'
                }, async())
            }, function (error) {
                logger.error('discover', { url: url, stack: error.stack })
                return [ null ]
            }], function (body) {
                return body
            })
        })(addresses)
    }, function (routes) {
        var route = routes.filter(function (route) {
            return route != null
        }).sort(function (left, right) {
            return Monotonic.compare(left.promise, right.promise)
        }).pop()
        return coalesce(route)
    })
})

module.exports = Discoverer
