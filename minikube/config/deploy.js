var fs = require('fs')
var path = require('path')
var yaml = require('js-yaml');
var children = require('child_process')

var order = [
    'Namespace',
    'ConfigMap',
    'DaemonSet',
    'Deployment',
    'Service'
]

var files = fs.readdirSync(__dirname).filter(function (file) {
    return /\.(?:json|yml)$/.test(file)
}).map(function (file) {
    var source = fs.readFileSync(path.join(__dirname, file), 'utf8')
    if (/\.yml$/.test(file)) {
        json = yaml.safeLoad(source)
    } else {
        json = JSON.parse(source)
    }
    return {
        name: file,
        json: json
    }
}).sort(function (left, right) {
    return order.indexOf(left.json.kind) - order.indexOf(right.json.kind)
}).forEach(function (file) {
    var args = [ 'apply', '--record' ]
    args.push('--filename', path.join(__dirname, file.name))
    children.spawnSync('kubectl', args, { stdio: [ 'inherit', 'inherit', 'inherit' ] })
})
