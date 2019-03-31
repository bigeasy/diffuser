console.log(JSON.stringify({
    kind: 'Service',
    apiVersion: 'v1',
    metadata: {
        name: 'funnel'
    },
    spec: {
        ports: [{
            name: 'funnel',
            port: 514,
            targetPort: 514,
            protocol: 'UDP'
        }],
        selector: {
            environment: 'minikube',
            name: 'funnel'
        }
    }
}, null, 2))
