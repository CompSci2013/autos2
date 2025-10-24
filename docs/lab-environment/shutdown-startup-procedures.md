# Autos2 Lab Shutdown and Startup Procedures

## Overview

This document provides procedures for cleanly shutting down and restarting the Autos2 development environment in Halo Labs.

---

## Current Running Services

### Development Containers
- **autos2-backend-dev**: Node.js development container on port 3000
- **autos2-frontend-dev**: Angular development container on port 4201

### Kubernetes Services
- **k3s cluster**: Kubernetes cluster
- **Elasticsearch**: Running in the `data` namespace
- **Original AUTOS**: Running in the `autos` namespace (if applicable)

### Background Processes
- **ng serve**: Angular development server (multiple instances may exist)
- **nodemon**: Backend development watcher (if running)

---

## Shutdown Procedure

### Step 1: Stop Development Containers

```bash
# Navigate to project directory
cd /home/odin/projects/autos2

# Stop frontend container
podman stop autos2-frontend-dev

# Stop backend container
podman stop autos2-backend-dev

# Verify containers stopped
podman ps -a | grep autos2
```

**Expected Output**: Both containers should show status "Exited"

---

### Step 2: Verify No Orphaned Processes

```bash
# Check for any running ng serve processes
ps aux | grep "ng serve"

# Kill any orphaned processes (if found)
pkill -f "ng serve"
```

---

### Step 3: Save Current Git State

```bash
cd /home/odin/projects/autos2

# Check for uncommitted changes
git status

# If there are uncommitted changes, stash them
git stash push -m "Pre-shutdown stash $(date +%Y-%m-%d_%H:%M:%S)"

# Verify clean state
git status
```

---

### Step 4: Document Current State (Optional)

```bash
# Save running container list
podman ps -a > ~/autos2-containers-$(date +%Y%m%d).txt

# Save git status
cd /home/odin/projects/autos2
git log -1 > ~/autos2-git-state-$(date +%Y%m%d).txt
git status >> ~/autos2-git-state-$(date +%Y%m%d).txt
```

---

### Step 5: Kubernetes Shutdown (Optional)

**Note**: Only if you need to stop the entire k3s cluster

```bash
# Stop k3s (will stop all Kubernetes services)
sudo systemctl stop k3s

# Verify k3s stopped
sudo systemctl status k3s
```

---

### Step 6: System Shutdown

```bash
# Shutdown the system
sudo shutdown -h now
```

---

## Startup Procedure

### Step 1: Power On Equipment

1. Power on the server/workstation
2. Wait for system to fully boot
3. Log in as your user

---

### Step 2: Verify System Services

```bash
# Check k3s is running (should auto-start)
sudo systemctl status k3s

# If not running, start it
sudo systemctl start k3s

# Wait for k3s to be ready (~30 seconds)
kubectl get nodes
```

**Expected Output**: Nodes should show "Ready" status

---

### Step 3: Verify Elasticsearch

```bash
# Check Elasticsearch pod
kubectl get pods -n data | grep elasticsearch

# If not running, check pod logs
kubectl logs -n data elasticsearch-0

# Test Elasticsearch API
curl -s http://elasticsearch.data.svc.cluster.local:9200/_cluster/health | jq
```

**Expected Output**: `"status": "green"` or `"yellow"`

---

### Step 4: Start Development Containers

```bash
cd /home/odin/projects/autos2

# Start backend container
podman start autos2-backend-dev

# Verify backend is running
podman ps | grep autos2-backend-dev

# Start frontend container
podman start autos2-frontend-dev

# Verify frontend is running
podman ps | grep autos2-frontend-dev
```

---

### Step 5: Start Development Servers

#### Option A: Start Both Backend and Frontend

```bash
# Terminal 1: Start backend (if not already running)
podman exec autos2-backend-dev npm run dev

# Terminal 2: Start frontend
podman exec autos2-frontend-dev ng serve --poll=2000
```

#### Option B: Use Background Processes

```bash
# Start backend in background
podman exec -d autos2-backend-dev npm run dev

# Start frontend in background
podman exec -d autos2-frontend-dev ng serve --poll=2000

# Monitor logs
podman logs -f autos2-backend-dev   # In terminal 1
podman logs -f autos2-frontend-dev  # In terminal 2
```

---

### Step 6: Verify Services Running

```bash
# Check backend API
curl -s http://localhost:3000/api/v1/health | jq

# Expected output:
# {
#   "status": "healthy",
#   "timestamp": "2025-10-24T..."
# }

# Check frontend
curl -s http://localhost:4201 | head -20

# Expected output: HTML with <title>Autos2App</title>
```

---

### Step 7: Restore Git State (If Stashed)

```bash
cd /home/odin/projects/autos2

# List stashes
git stash list

# If you stashed changes before shutdown
git stash pop

# Verify changes restored
git status
```

---

### Step 8: Resume Development

```bash
# Open your IDE
code /home/odin/projects/autos2

# Navigate to frontend in browser
xdg-open http://localhost:4201

# Or manually open: http://localhost:4201
```

---

## Quick Reference Commands

### Check Everything Status

```bash
#!/bin/bash
# save as: check-autos2-status.sh

echo "=== K3s Status ==="
kubectl get nodes

echo -e "\n=== Elasticsearch Status ==="
kubectl get pods -n data | grep elasticsearch

echo -e "\n=== Development Containers ==="
podman ps | grep autos2

echo -e "\n=== Backend Health ==="
curl -s http://localhost:3000/api/v1/health | jq

echo -e "\n=== Frontend Status ==="
curl -s http://localhost:4201 | grep -o "<title>.*</title>"
```

### Restart Everything

```bash
#!/bin/bash
# save as: restart-autos2.sh

echo "Stopping containers..."
podman stop autos2-frontend-dev autos2-backend-dev

echo "Starting containers..."
podman start autos2-backend-dev autos2-frontend-dev

echo "Waiting 5 seconds..."
sleep 5

echo "Starting development servers..."
podman exec -d autos2-backend-dev npm run dev
podman exec -d autos2-frontend-dev ng serve --poll=2000

echo "Waiting for services to start..."
sleep 10

echo "Checking status..."
curl -s http://localhost:3000/api/v1/health | jq
curl -s http://localhost:4201 | grep -o "<title>.*</title>"

echo -e "\n=== Ready for development! ==="
echo "Backend:  http://localhost:3000/api/v1"
echo "Frontend: http://localhost:4201"
```

---

## Troubleshooting

### Issue: Backend Container Won't Start

```bash
# Check container logs
podman logs autos2-backend-dev

# Try recreating container
podman rm -f autos2-backend-dev
podman run -d --name autos2-backend-dev \
  -v /home/odin/projects/autos2/backend:/app:z \
  -p 3000:3000 \
  localhost/autos2-backend:dev

# Install dependencies
podman exec autos2-backend-dev npm install
```

---

### Issue: Frontend Container Won't Start

```bash
# Check container logs
podman logs autos2-frontend-dev

# Try recreating container
podman rm -f autos2-frontend-dev
podman run -d --name autos2-frontend-dev \
  -v /home/odin/projects/autos2/frontend:/app:z \
  -p 4201:4200 \
  localhost/autos2-frontend:dev

# Install dependencies
podman exec autos2-frontend-dev npm install
```

---

### Issue: Elasticsearch Not Responding

```bash
# Check Elasticsearch pod
kubectl get pods -n data

# If pod is not running, check logs
kubectl logs -n data elasticsearch-0

# If pod is CrashLooping, check resources
kubectl describe pod -n data elasticsearch-0

# Restart Elasticsearch (last resort)
kubectl delete pod -n data elasticsearch-0
# k3s will automatically recreate it
```

---

### Issue: Port Already in Use

```bash
# Find what's using port 3000
sudo lsof -i :3000

# Kill the process (replace PID)
kill -9 <PID>

# Or use pkill
pkill -f "node.*3000"

# Same for port 4200/4201
sudo lsof -i :4201
pkill -f "ng serve"
```

---

### Issue: Git Conflicts After Restart

```bash
cd /home/odin/projects/autos2

# Check status
git status

# If there are conflicts after stash pop
git stash show
git diff

# Options:
# 1. Keep stashed changes
git stash pop

# 2. Discard stashed changes
git stash drop

# 3. View stash without applying
git stash show -p
```

---

## Best Practices

### Before Shutdown

1. ✅ Commit all important work
2. ✅ Push to GitLab: `git push gitlab main`
3. ✅ Stash uncommitted changes if needed
4. ✅ Document any special state

### After Startup

1. ✅ Verify k3s is running
2. ✅ Verify Elasticsearch is healthy
3. ✅ Check container status
4. ✅ Test backend API endpoint
5. ✅ Test frontend loads
6. ✅ Pull latest changes: `git pull gitlab main`

### Regular Maintenance

```bash
# Weekly: Clean up old containers
podman container prune

# Weekly: Clean up old images
podman image prune

# Monthly: Update dependencies
cd /home/odin/projects/autos2/backend
podman exec autos2-backend-dev npm outdated
podman exec autos2-backend-dev npm update

cd /home/odin/projects/autos2/frontend
podman exec autos2-frontend-dev npm outdated
podman exec autos2-frontend-dev npm update
```

---

## Current State Snapshot (2025-10-24)

### Git State
- **Branch**: main
- **Last Commit**: ADR system and user preferences documentation
- **Remote**: http://gitlab.minilab/halo/autos2.git
- **GitHub**: https://github.com/CompSci2013/autos2.git

### Running Services
- **Backend**: http://localhost:3000/api/v1
- **Frontend**: http://localhost:4201
- **Elasticsearch**: http://elasticsearch.data.svc.cluster.local:9200

### Development Containers
- **autos2-backend-dev**: Node.js 18 Alpine, volume mounted to ./backend
- **autos2-frontend-dev**: Node.js 18 Alpine with Angular CLI 14, volume mounted to ./frontend

### Key Files
- Backend: `/home/odin/projects/autos2/backend/`
- Frontend: `/home/odin/projects/autos2/frontend/`
- Docs: `/home/odin/projects/autos2/docs/`
- K8s Manifests: `/home/odin/projects/autos2/k8s/`

---

## Emergency Recovery

If everything is broken after restart:

```bash
# 1. Remove all containers
podman rm -f autos2-backend-dev autos2-frontend-dev

# 2. Rebuild images
cd /home/odin/projects/autos2/backend
podman build -f Dockerfile.dev -t localhost/autos2-backend:dev .

cd /home/odin/projects/autos2/frontend
podman build -f Dockerfile.dev -t localhost/autos2-frontend:dev .

# 3. Start fresh containers
cd /home/odin/projects/autos2

# Backend
podman run -d --name autos2-backend-dev \
  -v /home/odin/projects/autos2/backend:/app:z \
  -p 3000:3000 \
  localhost/autos2-backend:dev

podman exec autos2-backend-dev npm install
podman exec -d autos2-backend-dev npm run dev

# Frontend
podman run -d --name autos2-frontend-dev \
  -v /home/odin/projects/autos2/frontend:/app:z \
  -p 4201:4200 \
  localhost/autos2-frontend:dev

podman exec autos2-frontend-dev npm install
podman exec -d autos2-frontend-dev ng serve --poll=2000
```

---

## Related Documentation

- [Developer Environment Setup](./developer-environment.md)
- [Claude Onboarding Guide](./CLAUDE.md)
- [Architecture Overview](../design/angular-architecture.md)
- [Improvement Roadmap](../design/improvement-roadmap.md)

---

**Last Updated**: 2025-10-24
**Tested On**: Fedora Linux with k3s, Podman
