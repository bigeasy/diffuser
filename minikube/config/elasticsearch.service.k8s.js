console.log(JSON.stringify({
    kind: 'Service',
    apiVersion: 'v1',
    metadata: {
        name: 'elasticsearch',
        namespace: 'kibana'
    },
    spec: {
        ports: [{
            name: 'db',
            port: 9200,
            targetPort: 9200
        }],
        selector: {
            environment: 'minikube',
            name: 'elasticsearch'
        }
    }
}, null, 2))
