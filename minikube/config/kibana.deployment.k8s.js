console.log(JSON.stringify({
    kind: 'Deployment',
    apiVersion: 'extensions/v1beta1',
    metadata: {
        name: 'kibana',
        namespace: 'kibana',
        labels: {
            name: 'kibana',
            environment: 'minikube'
        }
    },
    spec: {
        replicas: 1,
        selector: {
            matchLabels: {
                name: 'kibana',
                environment: 'minikube'
            }
        },
        template: {
            metadata: {
                labels: {
                    name: 'kibana',
                    environment: 'minikube'
                }
            },
            spec: {
                restartPolicy: 'Always',
                terminationGracePeriodSeconds: 5,
                dnsPolicy: 'ClusterFirst',
                containers: [{
                    name: 'kibana',
                    image: 'docker.elastic.co/kibana/kibana:7.0.0',
                    imagePullPolicy: 'Always',
                    resources: {
                        limits: { cpu: '500m', memory: '512Mi' },
                        requests: { cpu: '100m', memory: '512Mi' }
                    },
                    ports: [{
                        name: 'ui', containerPort: 5601
                    }],
                    env: [{
                        name: "NODE_OPTIONS",
                        value: "--max-old-space-size=256"
                    }, {
                        name: 'ELASTICSEARCH_URL',
                        value: 'http://elasticsearch.kibana:9200'
                    }, {
                        name: 'XPACK_MONITORING_ENABLED',
                        value: 'false'
                    }, {
                        name: 'XPACK_SECURITY_ENABLED',
                        value: 'false'
                    }]
                }]
            }
        }
    }
}, null, 4))
