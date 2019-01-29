require('proof')(1, prove)

function prove (okay) {
    var hangup = require('../hangup')

    require('prolific.sink').json = function (level, qualifier, label, entry) {
        okay({
            level: level,
            qualifier: qualifier,
            label: label,
            entry: entry
        }, {
            level: 'error',
            qualifier: 'diffuser',
            label: 'label',
            entry: { label: 'label', value: 1 }
        }, 'error')
    }
    hangup({ label: 'label', value: 1 })
}
