// The MIT License
//
// Copyright (c) 2018-2019 Alan Gutierrez
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml');
const children = require('child_process')

const order = [
    'Namespace',
    'ConfigMap',
    'DaemonSet',
    'Deployment',
    'Service'
]

const files = fs.readdirSync(__dirname).filter(function (file) {
    return /\.(?:json|ya?ml)$/.test(file)
}).map(function (file) {
    const source = fs.readFileSync(path.join(__dirname, file), 'utf8')
    if (/\.ya?ml$/.test(file)) {
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
    const args = [ 'apply', '--record' ]
    args.push('--filename', path.join(__dirname, file.name))
    children.spawnSync('kubectl', args, { stdio: [ 'inherit', 'inherit', 'inherit' ] })
})
