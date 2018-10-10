require('proof')(3, prove)

function prove (okay) {
    var Backlogger = require('../backlogger')
    var backlogger = new Backlogger
    var shifter = backlogger.queue.shifter()

    backlogger.setPromise('1/0')

    var value = 0
    backlogger.push({ value: value++ })
    okay(shifter.shift(), { value: 0 }, 'push')
    backlogger.push({ promise: '1/0', value: value++ })
    okay(shifter.shift(), { promise: '1/0', value: 1 }, 'push with promise')
    backlogger.push({ promise: '2/0', value: value++ })
    backlogger.push({ promise: '2/0', value: value++ })
    backlogger.push({ promise: '3/0', value: value++ })
    okay(shifter.shift(), null, 'push promise not ready')
    backlogger.setPromise('2/0')
}
