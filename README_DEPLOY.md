# ByteBattle Kubernetes Deployment

These manifests deploy ByteBattle into the `bytebattle` namespace on a kubeadm cluster.

## Prerequisites

- A working kubeadm cluster with a default `StorageClass`.
- Docker Hub images available:
  - `mahdimasmoudi/bytebattle-frontend:latest`
  - `mahdimasmoudi/bytebattle-backend:latest`
  - `mahdimasmoudi/bytebattle-judge:latest`
- NGINX Ingress Controller installed.

## Install NGINX Ingress Controller

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.12.1/deploy/static/provider/baremetal/deploy.yaml
kubectl get pods -n ingress-nginx
```

On bare metal kubeadm clusters, expose the ingress controller with the node IP and the NodePort shown by:

```bash
kubectl get svc -n ingress-nginx
```

## Configure Local DNS

Add this line to `/etc/hosts` on the machine used to access the app:

```text
<IP_NODE> bytebattle.local
```

Replace `<IP_NODE>` with the IP address of a node that can reach the NGINX Ingress Controller.

## Apply Manifests

Apply the namespace first, then the storage and application dependencies, then the app, monitoring, and ingress:

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/mongodb-deployment.yaml
kubectl apply -f k8s/redis-deployment.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/judge-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/monitoring/prometheus.yml
kubectl apply -f k8s/monitoring/prometheus-deployment.yaml
kubectl apply -f k8s/monitoring/grafana-datasources.yml
kubectl apply -f k8s/monitoring/grafana-deployment.yaml
kubectl apply -f k8s/ingress.yaml
```

## Verify

```bash
kubectl get pods -n bytebattle
kubectl get svc -n bytebattle
kubectl get ingress -n bytebattle
kubectl get pvc -n bytebattle
```

Open:

```text
http://bytebattle.local
http://bytebattle.local/api
http://bytebattle.local/grafana
```

## Debug

```bash
kubectl describe pod <pod-name> -n bytebattle
kubectl logs <pod-name> -n bytebattle
kubectl logs deployment/backend-deployment -n bytebattle
kubectl get events -n bytebattle --sort-by=.lastTimestamp
```

## Optional Node Placement

The manifests include commented `nodeSelector` examples:

- frontend/backend: `role: web`
- judge: `role: compute`
- MongoDB/Redis: `role: storage`

Only enable them after labeling your nodes, for example:

```bash
kubectl label node <node-name> role=web
kubectl label node <node-name> role=compute
kubectl label node <node-name> role=storage
```
