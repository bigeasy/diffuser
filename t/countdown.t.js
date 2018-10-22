require('proof')(6, prove)

function prove (okay) {
    var Countdown = require('../countdown')
    var countdown = new Countdown
    countdown.start({
        promise: '7/0',
        properties: {
            '1/0': { count: 3 },
            '2/0': { count: 3 },
            '3/0': { count: 3 },
            '4/0': { count: 3 }
        }
    })
    okay(countdown.remaining('7/0'), 12, 'exists')
    countdown.arrive('7/0', { promise: '3/0', index: 0 })
    countdown.arrive('7/0', { promise: '3/0', index: 1 })
    okay(countdown.remaining('7/0'), 10, 'arrive')
    countdown.depart('7/0', '3/0')
    okay(countdown.remaining('7/0'), 9, 'depart')
    countdown.arrive('7/0', { promise: '3/0', index: 2 })
    countdown.depart('7/0', '3/0')
    okay(countdown.remaining('7/0'), 9, 'missed')
    countdown.depart('7/0', '4/0')
    okay(countdown.remaining('7/0'), 6, 'end of iterator')
    countdown.arrive('7/0', { promise: '1/0', index: 0 })
    countdown.arrive('7/0', { promise: '1/0', index: 1 })
    countdown.arrive('7/0', { promise: '1/0', index: 2 })
    countdown.arrive('7/0', { promise: '2/0', index: 0 })
    countdown.arrive('7/0', { promise: '2/0', index: 1 })
    countdown.arrive('7/0', { promise: '2/0', index: 2 })
    okay(countdown.remaining('7/0'), null, 'done')
    countdown.arrive('7/0', { promise: '2/0', index: 2 })
    countdown.depart('7/0', '4/0')
}
