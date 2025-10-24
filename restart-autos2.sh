#!/bin/bash
echo "=== Restarting Autos2 Development Environment ==="

echo "1. Starting containers..."
podman start autos2-backend-dev autos2-frontend-dev

echo "2. Waiting for containers to initialize..."
sleep 5

echo "3. Starting backend development server..."
podman exec -d autos2-backend-dev npm run dev

echo "4. Starting frontend development server..."
podman exec -d autos2-frontend-dev ng serve --poll=2000

echo "5. Waiting for services to start..."
sleep 15

echo ""
echo "=== Verifying Services ==="

echo "Backend API:"
curl -s http://localhost:3000/api/v1/health | jq '.' || echo "❌ Backend not ready yet"

echo ""
echo "Frontend:"
curl -s http://localhost:4201 | grep -o "<title>.*</title>" || echo "❌ Frontend not ready yet"

echo ""
echo "=== Ready! ==="
echo "Backend:  http://localhost:3000/api/v1"
echo "Frontend: http://localhost:4201"
echo ""
echo "To view logs:"
echo "  Backend:  podman logs -f autos2-backend-dev"
echo "  Frontend: podman logs -f autos2-frontend-dev"
