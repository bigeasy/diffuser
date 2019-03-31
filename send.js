var socket = require('dgram').createSocket('udp4')
socket.send('{}',514,  process.argv[2], function () {
    socket.close()
})
