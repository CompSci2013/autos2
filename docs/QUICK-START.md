# Autos2 - Quick Start Guide

**Project:** Autos2 Vehicle Search Application
**URL:** http://autos2.minilab
**Namespace:** autos2

---

## Key Differences from Original AUTOS

- **Namespace:** `autos2` (not `autos`)
- **URL:** `autos2.minilab` (not `autos.minilab`)
- **Images:** `localhost/autos2-*` (not `localhost/autos-*`)
- **Can run simultaneously** with original AUTOS for comparison

---

## Prerequisites

- K3s cluster running on Thor
- Elasticsearch at `elasticsearch.data.svc.cluster.local:9200`
- Index `autos-unified` populated
- Podman installed

---

## Backend Development (Container-Based)

### Build Dev Container

```bash
cd /home/odin/projects/autos2/backend
podman build -f Dockerfile.dev -t localhost/autos2-backend:dev .
```

### Run Dev Container

```bash
podman run -d \
  --name autos2-backend-dev \
  --network host \
  -v /home/odin/projects/autos2/backend:/app:z \
  -w /app \
  localhost/autos2-backend:dev
```

### Development Commands (Inside Container)

```bash
# Install dependencies
podman exec -it autos2-backend-dev npm install

# Run in development mode (with watch)
podman exec -it autos2-backend-dev npm run dev

# Build TypeScript
podman exec -it autos2-backend-dev npm run build

# Run tests
podman exec -it autos2-backend-dev npm test

# Lint code
podman exec -it autos2-backend-dev npm run lint
```

### Stop Dev Container

```bash
podman stop autos2-backend-dev
podman rm autos2-backend-dev
```

---

## Frontend Development (Container-Based)

### Build Dev Container

```bash
cd /home/odin/projects/autos2/frontend
podman build -f Dockerfile.dev -t localhost/autos2-frontend:dev .
```

### Run Dev Container

```bash
podman run -d \
  --name autos2-frontend-dev \
  --network host \
  -v /home/odin/projects/autos2/frontend:/app:z \
  -w /app \
  localhost/autos2-frontend:dev
```

### Development Commands (Inside Container)

```bash
# Install dependencies
podman exec -it autos2-frontend-dev npm install

# Start dev server
podman exec -it autos2-frontend-dev ng serve --host 0.0.0.0 --port 4200

# Build for production
podman exec -it autos2-frontend-dev ng build --configuration production

# Run tests
podman exec -it autos2-frontend-dev ng test

# Generate component
podman exec -it autos2-frontend-dev ng generate component my-component
```

### Access Points

- **Dev Server:** http://localhost:4200 or http://thor:4200
- **Production:** http://autos2.minilab (after deployment)

---

## Production Deployment

### 1. Build Backend Production Image

```bash
cd /home/odin/projects/autos2/backend
podman build -t localhost/autos2-backend:v1.0.0 .
```

### 2. Build Frontend Production Image

```bash
cd /home/odin/projects/autos2/frontend
podman build -f Dockerfile.prod -t localhost/autos2-frontend:prod .
```

### 3. Export Images

```bash
# Backend
cd /home/odin/projects/autos2/backend
podman save -o autos2-backend-v1.0.0.tar localhost/autos2-backend:v1.0.0

# Frontend
cd /home/odin/projects/autos2/frontend
podman save -o autos2-frontend-prod.tar localhost/autos2-frontend:prod
```

### 4. Import to K3s

```bash
# Backend
sudo k3s ctr images import /home/odin/projects/autos2/backend/autos2-backend-v1.0.0.tar

# Frontend
sudo k3s ctr images import /home/odin/projects/autos2/frontend/autos2-frontend-prod.tar
```

### 5. Deploy to Kubernetes

```bash
cd /home/odin/projects/autos2/k8s

# Create namespace
kubectl apply -f namespace.yaml

# Deploy backend
kubectl apply -f backend-deployment.yaml
kubectl apply -f backend-service.yaml

# Deploy frontend
kubectl apply -f frontend-deployment.yaml
kubectl apply -f frontend-service.yaml

# Create ingress
kubectl apply -f ingress.yaml
```

### 6. Verify Deployment

```bash
# Check pods
kubectl get pods -n autos2

# Check services
kubectl get svc -n autos2

# Check ingress
kubectl get ingress -n autos2

# Test backend health
curl http://autos2.minilab/api/v1/health

# Test backend API
curl http://autos2.minilab/api/v1/manufacturers

# Access frontend
firefox http://autos2.minilab
```

---

## Useful Commands

### Check Running Containers

```bash
podman ps | grep autos2
```

### View Container Logs

```bash
podman logs -f autos2-backend-dev
podman logs -f autos2-frontend-dev
```

### Shell Into Container

```bash
podman exec -it autos2-backend-dev sh
podman exec -it autos2-frontend-dev sh
```

### Check Kubernetes Status

```bash
# Pods
kubectl get pods -n autos2

# Logs
kubectl logs -n autos2 deployment/autos2-backend --tail=50
kubectl logs -n autos2 deployment/autos2-frontend --tail=50

# Restart deployment
kubectl rollout restart deployment/autos2-backend -n autos2
kubectl rollout restart deployment/autos2-frontend -n autos2
```

### Clean Up

```bash
# Stop and remove dev containers
podman stop autos2-backend-dev autos2-frontend-dev
podman rm autos2-backend-dev autos2-frontend-dev

# Remove Kubernetes resources
kubectl delete namespace autos2

# Remove images from Podman
podman rmi localhost/autos2-backend:dev localhost/autos2-frontend:dev
```

---

## Environment Variables

### Backend (.env)

```
NODE_ENV=development
PORT=3000
API_VERSION=v1
ELASTICSEARCH_HOST=http://thor:30398
ELASTICSEARCH_INDEX=autos-unified
CORS_ORIGIN=http://localhost:4200
```

### Kubernetes (backend-deployment.yaml)

```yaml
ELASTICSEARCH_HOST: http://elasticsearch.data.svc.cluster.local:9200
ELASTICSEARCH_INDEX: autos-unified
NODE_ENV: production
PORT: 3000
API_VERSION: v1
CORS_ORIGIN: http://autos2.minilab
```

---

## API Endpoints

Base URL: `http://autos2.minilab/api/v1`

- `GET /manufacturers` - List manufacturers
- `GET /manufacturers/:name/models` - Models by manufacturer
- `GET /vehicles` - Search vehicles (with filters)
- `GET /vehicles/:id` - Get vehicle details
- `GET /filters` - Available filter options
- `GET /stats` - Database statistics
- `GET /health` - Health check

Full API documentation: [api-specification.md](api-specification.md)

---

## Troubleshooting

### Container Won't Start

```bash
# Check logs
podman logs autos2-backend-dev

# Verify image exists
podman images | grep autos2

# Rebuild if needed
podman build -f Dockerfile.dev -t localhost/autos2-backend:dev .
```

### Permission Errors

```bash
# Ensure :z flag on volume mount for SELinux
-v /home/odin/projects/autos2/backend:/app:z
```

### Pods Not Starting

```bash
# Check if image imported
sudo k3s ctr images list | grep autos2

# Check pod events
kubectl describe pod -n autos2 <pod-name>

# View logs
kubectl logs -n autos2 <pod-name>
```

### Cannot Access autos2.minilab

```bash
# Add to /etc/hosts
echo "192.168.0.244 autos2.minilab" | sudo tee -a /etc/hosts

# Verify ingress
kubectl get ingress -n autos2
```

---

## Development Workflow

1. **Start dev containers** for backend and/or frontend
2. **Edit code** in VS Code (Remote-SSH to Thor)
3. **Changes auto-reload** (backend with nodemon, frontend with ng serve)
4. **Test locally** at http://localhost:4200 (frontend) or http://localhost:3000 (backend)
5. **When ready**, build production images
6. **Deploy to K3s** for integration testing
7. **Access** at http://autos2.minilab

---

**Last Updated:** 2025-10-24
**Maintained By:** Claude + Odin
