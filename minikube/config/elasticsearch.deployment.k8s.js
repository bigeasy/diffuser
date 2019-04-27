console.log(JSON.stringify({
    kind: 'Deployment',
    apiVersion: 'extensions/v1beta1',
    metadata: {
        name: 'elasticsearch',
        namespace: 'kibana',
        labels: {
            name: 'elasticsearch',
            environment: 'minikube'
        }
    },
    spec: {
        replicas: 1,
        selector: {
            matchLabels: {
                name: 'elasticsearch',
                environment: 'minikube'
            }
        },
        template: {
            metadata: {
                labels: {
                    name: 'elasticsearch',
                    environment: 'minikube'
                }
            },
            spec: {
                restartPolicy: 'Always',
                terminationGracePeriodSeconds: 5,
                dnsPolicy: 'ClusterFirst',
                containers: [{
                    name: 'elasticsearch',
                    image: 'docker.elastic.co/elasticsearch/elasticsearch:7.0.0',
                    imagePullPolicy: 'Always',
                    resources: {
                        limits: {
                            cpu: '500m',
                            memory: '500Mi'
                        },
                        requests: {
                            cpu: '500m',
                            memory: '500Mi'
                        }
                    },
                    ports: [{
                        name: 'db', containerPort: 9200
                    }, {
                        name: 'transport', containerPort: 9300
                    }],
                    volumeMounts: [{
                        name: 'elasticsearch', mountPath: '/data',
                    }],
                    env: [{
                        name: 'discovery.type',
                        value: 'single-node'
                    }, {
                        name: 'ES_JAVA_OPTS',
                        value: '-Xms256m -Xmx256m'
                    /*
                        name: 'NAMESPACE',
                        valueFrom: { fieldRef: { fieldPath: 'metadata.namespace' } }
                    }, {
                        name: 'MINIMUM_MASTER_NODES',
                        value: '1'
                        */
                    }]
                }],/*,
                initContainers: [{
                    image: 'registry.hub.docker.com/library/alpine:latest',
                    command: ['/sbin/sysctl', '-w', 'vm.max_map_count=262144'],
                    name: 'elasticsearch-init',
                    securityContext: { privileged: true }
                }],*/
                volumes: [{
                    name: 'elasticsearch', emptyDir: {}
                }]
            }
        }
    }
}, null, 4))
