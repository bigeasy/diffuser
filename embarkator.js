var cadence = require('cadence')

var Turnstile = require('turnstile')
Turnstile.Queue = require('turnstile/queue')

function Embarkator (destructible, options) {
    this.turnstile = new Turnstile
    this._location = options.url
    this._island = options.island
    this._id = options.id
    this.turnstile.listen(destructible.monitor('turnstile'))
    this._queue = new Turnstile.Queue(this, '_embark', this.turnstile)
    this._ua = options.ua
}

Embarkator.prototype._embark = cadence(function (async, envelope) {
    console.log('arriving', envelope)
    var message = envelope.body
    async(function () {
        this._ua.fetch({
            url: './register',
            timeout: 1000,
            post: {
                token: '-',
                island: this._island,
                id: this._id + '/' + message.name,
                url: this._location,
                bootstrap: true,
                join: true,
                arrive: true,
                acclimated: true,
                depart: true,
                properties: {
                    name: message.name,
                    isRouter: message.isRouter,
                    location: this._location,
                    count: message.count
                }
            },
            parse: 'json',
            raise: true
        }, async())
    }, function () {
        console.log('--- emarked ---')
    })
})

Embarkator.prototype.push = function (message) {
    this._queue.push(message)
}

module.exports = cadence(function (async, destructible, options) {
    return new Embarkator(destructible, options)
})
