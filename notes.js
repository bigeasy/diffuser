var http = require('http')

var server = http.createServer(function (request, response) {
    console.log('request', request.url)
    response.writeHead(200)
    response.end()
})

server.listen(8888, '127.0.0.1', function () {
    console.log('listening')
    var request = http.get('http://127.0.0.1:8888/')
    request.on('response', function (response) { response.resume(); console.log('responeded') })
    request.on('aborted', function () { console.log('aborted') })
    request.on('abort', function () { console.log('abort') })
    request.on('error', function (error) { console.log(error.stack) })
    request.on('upgrade', function () { console.log('upgraded') })
    setTimeout.bind(null, function () { console.log('will aborting'); request.abort() }, 0)()
})
