require('proof')(6, prove)

function prove (okay) {
    var Countdown = require('../countdown')
    var countdown = new Countdown
    okay(countdown.count, 0, 'empty')
    countdown.start({
        promise: '7/0',
        properties: {
            '1/0': { count: 3 },
            '2/0': { count: 3 }
        }
    })
    okay(countdown.count, 6, 'count')
    countdown.arrive('7/0', { promise: '2/0', index: 0 })
    countdown.arrive('7/0', { promise: '2/0', index: 1 })
    okay(countdown.count, 4, 'arrive')
    countdown.arrive('6/0', { promise: '2/0', index: 2 })
    okay(countdown.count, 4, 'n/a')
    countdown.arrive('7/0', { promise: '2/0', index: 1 })
    okay(countdown.count, 4, 'dupe')
    countdown.arrive('7/0', { promise: '2/0', index: 2 })
    countdown.arrive('7/0', { promise: '1/0', index: 0 })
    countdown.arrive('7/0', { promise: '1/0', index: 1 })
    countdown.arrive('7/0', { promise: '1/0', index: 2 })
    okay(countdown.count, 0, 'done')
}
