Run Diffuser with a dummy application in Minikube. The application will route
messages through Diffuser.


## Performance Monitoring with Telegraf, InfluxDB, Chronograf, Kapacitor

Created a telegraph Daemon Set to run a Telegraf collector on Minikube.

Process is to start everything, then configure Chronograf through the UI.

 * [How to spin up the TICK Stack in a Kubernetes
 instance](https://www.influxdata.com/blog/how-to-spin-up-the-tick-stack-in-a-kubernetes-instance/)
 ~ Primary reference on starting a TICK stack in Minikube.
 * [Deploy TICK stack on Kubernetes: Telegraf, InfluxDB, Chronograf, and
 Kapacitor](https://vinta.ws/code/deploy-tick-stack-on-kubernetes-telegraf-influxdb-chronograf-and-kapacitor.html)
 ~ Didn't really use this much, but looks useful for a deploy that does not use
 Helm.
 * [Get Started With Kubernetes Using
 Minikube](https://docs.bitnami.com/kubernetes/get-started-kubernetes/) ~
 Minikube reference.
 * [InfluxDB Line Protocol tutorial](https://docs.influxdata.com/influxdb/v1.5/write_protocols/line_protocol_tutorial/)
 * [Instrumenting Your Node/Express Application](https://www.influxdata.com/blog/instrumenting-your-node-express-application/)
 * [Securing your Helm Installation](https://helm.sh/docs/using_helm/#securing-your-helm-installation)
 * [Running Kubernetes Locally via
 Minikube](https://kubernetes.io/docs/setup/minikube/)
 * [Step 3: Installing the TICK](https://darienmt.com/kubernetes/2018/02/22/local-kubernetes-first-encounter-with-the-pilot.html#step-3-installing-the-tick)
 ~ Helped to demystify, but not directly helpful.
 * [Writing data with the HTTP
 API](https://docs.influxdata.com/influxdb/v1.7/guides/writing_data/)
 * [Importing and exporting Chronograf
 dashboards](https://docs.influxdata.com/chronograf/v1.7/administration/import-export-dashboards/)
 * [vm-driver=none](https://github.com/kubernetes/minikube/blob/master/docs/vmdriver-none.md)
 * [Monitoring Kubernetes Architecture](https://dzone.com/articles/monitoring-kubernetes-architecture)
 * [HA(High-Availability) Setup for InfluxDB](https://blog.kmonsoor.com/ha-setup-for-influxdb/)
 * [Hardware sizing guidelines](https://docs.influxdata.com/influxdb/v1.7/guides/hardware_sizing/)
 * [Using Port Forwarding to Access Applications in a
 Cluster](https://kubernetes.io/docs/tasks/access-application-cluster/port-forward-access-application-cluster/)
 * [Expose port in
 minikube](https://stackoverflow.com/questions/40767164/expose-port-in-minikube)
