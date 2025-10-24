#!/bin/bash
echo "=== Autos2 Development Environment Status ==="
echo ""

echo "=== K3s Status ==="
kubectl get nodes 2>/dev/null || echo "❌ k3s not accessible"
echo ""

echo "=== Elasticsearch Status ==="
kubectl get pods -n data 2>/dev/null | grep elasticsearch || echo "❌ Cannot check Elasticsearch"
echo ""

echo "=== Development Containers ==="
podman ps -a | grep autos2 || echo "❌ No autos2 containers found"
echo ""

echo "=== Backend Health ==="
curl -s http://localhost:3000/api/v1/health 2>/dev/null | jq '.' 2>/dev/null || echo "❌ Backend not responding"
echo ""

echo "=== Frontend Status ==="
curl -s http://localhost:4201 2>/dev/null | grep -o "<title>.*</title>" || echo "❌ Frontend not responding"
echo ""

echo "=== Git Status ==="
cd /home/odin/projects/autos2
echo "Branch: $(git branch --show-current)"
echo "Last commit: $(git log -1 --oneline)"
echo "Status: $(git status --short | wc -l) file(s) with changes"
