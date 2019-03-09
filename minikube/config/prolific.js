var fs = require('fs')
var path = require('path')

var json = {
    apiVersion: 'v1',
    kind: 'ConfigMap',
    metadata: {
        name: 'diffuser.prolific',
        namespace: 'diffuser'
    },
    data: {}
}

process.argv.splice(2).forEach(function (file) {
    json.data[path.basename(file)] = fs.readFileSync(file, 'utf8')
})

process.stdout.write(JSON.stringify(json, null, 2) + '\n')
