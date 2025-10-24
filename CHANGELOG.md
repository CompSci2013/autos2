# Changelog

All notable changes to the Autos2 project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Angular 14 frontend application
- Production deployment to Kubernetes
- CI/CD pipeline setup

## [0.1.0] - 2025-10-24

### Added
- Initial project setup with BMAD v6-Alpha framework
- Node.js + TypeScript + Express backend API
- Elasticsearch integration (autos-unified index)
- 6 RESTful API endpoints:
  - GET /api/v1/manufacturers - List manufacturers with counts
  - GET /api/v1/manufacturers/:name/models - Get models for manufacturer
  - GET /api/v1/vehicles - Search vehicles with filters
  - GET /api/v1/vehicles/:id - Get vehicle by ID
  - GET /api/v1/filters - Get available filter options
  - GET /api/v1/stats - Database statistics
  - GET /api/v1/health - Health check
- Docker support for development and production
  - Dockerfile.dev - Development container with hot reload
  - Dockerfile - Multi-stage production build
- Kubernetes deployment manifests for autos2 namespace
  - namespace.yaml
  - backend-deployment.yaml
  - backend-service.yaml
  - frontend-deployment.yaml (ready for Angular)
  - frontend-service.yaml (ready for Angular)
  - ingress.yaml (autos2.minilab)
- Comprehensive documentation:
  - API specification
  - Quick start guide
  - Session summaries
  - Lab environment docs
- Git repository with GitLab remote
  - Repository: http://gitlab.minilab/halo/autos2.git
  - Branch: main

### Changed
- N/A (initial release)

### Fixed
- TypeScript compilation errors with Elasticsearch aggregation types
- Container volume mount permissions for development
- SELinux compatibility with :z flag on volume mounts

### Technical Details

**Backend Stack:**
- Node.js 18 (Alpine)
- TypeScript 5.3
- Express 4.18
- Elasticsearch client 8.10

**Database:**
- Elasticsearch at thor:30398 (dev) / elasticsearch.data.svc.cluster.local:9200 (prod)
- Index: autos-unified
- 793 vehicles, 70 manufacturers, 739 models

**Infrastructure:**
- Container runtime: Podman
- Orchestration: K3s (Kubernetes)
- Namespace: autos2 (isolated from original 'autos')
- Ingress: autos2.minilab

### Documentation
- Session summary: [2025-10-24-initial-setup.md](docs/sessions/2025-10-24-initial-setup.md)
- API docs: [api-specification.md](docs/api-specification.md)
- Quick start: [QUICK-START.md](docs/QUICK-START.md)

---

## Version History

- **0.1.0** (2025-10-24) - Initial backend API implementation
- Future versions will add frontend and additional features

---

**Repository:** http://gitlab.minilab/halo/autos2
**Maintainer:** Odin + Claude
**License:** MIT (if applicable)
