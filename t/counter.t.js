require('proof')(4, prove)

function prove (okay) {
    var Counter = require('../counter')
    var counter = new Counter

    okay(counter.increment('1/0'), 1, 'start')
    okay(counter.increment('1/0'), 2, 'increment')
    okay(counter.increment('2/0'), 1, 'next start')
    counter.updated('1/0')
    okay(counter.increment('2/0'), 2, 'next increment')
}
