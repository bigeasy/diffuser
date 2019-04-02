var cadence = require('cadence')
var Signal = require('signal')
var url = require('url')
var UserAgent = require('vizsla')
var logger = require('prolific.logger').createLogger('dummy')

function Worker (destructible, tracker, diffuser, mingle, identifier) {
    this._tracker = tracker
    this._destructable = destructible
    this._diffuser = diffuser
    this._delay = new Signal
    this._identifier = identifier
    this._mingle = mingle
    this._instance = '0'
    this._clients = {}
    this._ua = new UserAgent
}

Worker.prototype.request = cadence(function (async) {
    var request = async.loop([], function () {
        async(function () {
            this._delay.wait(async())
            this._timeout = setTimeout(this._delay.notify.bind(this._delay), 1000)
        }, function () {
            this._timeout = null
            if (this.destroyed) {
                return [ async.break ]
            }
            async(function () {
                this._mingle.connect({}).inbox.dequeue(async())
            }, function (endpoints) {
                endpoints = endpoints || []
                var addresses = endpoints.map(function (endpoint) {
                    return url.parse(endpoint).hostname
                })
                var requests = this._tracker.request(this._identifier, addresses)
                async.forEach([ addresses ], function (address) {
                    if (this.destroyed) {
                        return [ request.break ]
                    }
                    var json = requests[address]
                    async(function () {
                        this._fetch = this._ua.fetch({
                            url: 'http://' + address + ':8080/route',
                            post: json,
                            timeout: 5000,
                            parse: 'json'
                        }, async())
                    }, function (body, response) {
                        console.log(body, response.statusCode)
                        this._fetch = null
                        if (body != null) {
                            this._tracker.record(json.cookie, { address: address }, 'received')
                        }
                    })
                })
            })
        })
    })
})

Worker.prototype.destroy = function () {
    this._ua.destroy()
    if (this._fetch) {
        this._fetch.cancel()
    }
    this.destroyed = true
    if (this._timeout != null) {
        clearTimeout(this._timeout)
    }
    this._delay.unlatch()
}

module.exports = cadence(function (async, destructible, tracker, diffuser, resolver, address) {
    var worker = new Worker(destructible, tracker, diffuser, resolver, address)
    destructible.destruct.wait(worker, 'destroy')
    worker.request(destructible.durable('request'))
    return worker
})
