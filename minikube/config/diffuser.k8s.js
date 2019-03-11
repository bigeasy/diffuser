console.log(JSON.stringify({
    kind: 'Deployment',
    apiVersion: 'extensions/v1beta1',
    metadata: {
        name: 'diffuser',
        namespace: 'diffuser',
        labels: {
            name: 'diffuser',
            environment: 'minikube'
        }
    },
    spec: {
        replicas: 1,
        selector: {
            matchLabels: {
                name: 'diffuser',
                environment: 'minikube'
            }
        },
        template: {
            metadata: {
                labels: {
                    name: 'diffuser',
                    environment: 'minikube'
                }
            },
            spec: {
                restartPolicy: 'Always',
                terminationGracePeriodSeconds: 5,
                dnsPolicy: 'ClusterFirst',
                containers: [{
                    name: 'diffuser',
                    image: 'bigeasy/diffuser:kube',
                    imagePullPolicy: 'Never',
                    command: [ '/app/minikube/bin/diffuser' ],
                    ports: [{
                        name: 'compassion', containerPort: 8486
                    }, {
                        name: 'dummy', containerPort: 8080
                    }],
                    volumeMounts: [{
                        name: 'olio', mountPath: '/etc/olio',
                    }, {
                        name: 'prolific', mountPath: '/etc/prolific'
                    }]
                } /*, {
                    name: 'compassion',
                    image: 'bigeasy/addendum:kube',
                    imagePullPolicy: 'Never',
                    command: [ '/app/bin/compassion' ],
                    ports: [{ name: 'compassion', containerPort: 8486 }],
                    volumeMounts: [{ name: 'prolific', mountPath: '/etc/prolific' }]
                }, {
                    name: 'addendum',
                    image: 'bigeasy/addendum:kube',
                    imagePullPolicy: 'Never',
                    command: [ '/app/bin/addendum' ],
                    volumeMounts: [{ name: 'prolific', mountPath: '/etc/prolific' }]
                } */],
                volumes: [{
                    name: 'prolific', configMap: { name: 'diffuser.prolific' }
                }, {
                    name: 'olio', configMap: { name: 'diffuser.olio' }
                }]
            }
        }
    }
}, null, 4))
