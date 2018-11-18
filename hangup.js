var logger = require('prolific.logger').createLogger('diffuser')

module.exports = function (entry) {
    logger.error(entry.label, entry)
}
