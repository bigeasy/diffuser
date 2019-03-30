console.log(JSON.stringify({
    kind: 'Deployment',
    apiVersion: 'extensions/v1beta1',
    metadata: {
        name: 'funnel',
        namespace: 'diffuser',
        labels: {
            name: 'funnel',
            environment: 'minikube'
        }
    },
    spec: {
        replicas: 1,
        selector: {
            matchLabels: {
                name: 'funnel',
                environment: 'minikube'
            }
        },
        template: {
            metadata: {
                labels: {
                    name: 'funnel',
                    environment: 'minikube'
                }
            },
            spec: {
                restartPolicy: 'Always',
                terminationGracePeriodSeconds: 5,
                dnsPolicy: 'ClusterFirst',
                containers: [{
                    name: 'funnel',
                    image: 'bigeasy/diffuser:kube',
                    imagePullPolicy: 'Never',
                    command: [ '/app/minikube/bin/funnel' ],
                    ports: [{
                        name: 'logger', containerPort: 514, protocol: 'UDP'
                    }],
                    volumeMounts: [{
                        name: 'olio', mountPath: '/etc/olio',
                    }, {
                        name: 'prolific', mountPath: '/etc/prolific'
                    }]
                }],
                volumes: [{
                    name: 'prolific', configMap: { name: 'diffuser.prolific' }
                }, {
                    name: 'olio', configMap: { name: 'diffuser.olio' }
                }]
            }
        }
    }
}, null, 4))
