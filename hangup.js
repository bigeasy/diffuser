var logger = require('prolific.logger').createLogger('diffuser')

module.exports = function (error) {
    logger.error('socket', { stack: error.stack })
}
