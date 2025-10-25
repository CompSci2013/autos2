# Claude Code Session Start Prompt

**Last Updated**: 2025-10-25 (Session 6 Complete - Browse-First Pattern, Backend Pagination)

---

## Copy-Paste This to Start Next Session

```
Hello Claude. I'm resuming work on the Autos2 project.

Project: Autos2 - Vehicle database application (Angular 14 + Node.js + Elasticsearch)
Location: /home/odin/projects/autos2
Git Branch: main
Production URL: http://autos2.minilab
Dev URL: http://192.168.0.244:4201 (use IP, not localhost)

Application Status: ✅ PRODUCTION WORKING - Browse-First Pattern Complete
- Production: Running at http://autos2.minilab (✅ v1.0.0-session6 deployed)
- Development: http://192.168.0.244:4201 (✅ All features working)
- Backend API: http://autos2.minilab/api/v1 (2 replicas, healthy, CORS enabled)
- Dev Container: autos2-frontend-dev (running with /home/odin/projects/autos2/frontend:/app:z)

✅ SESSION 6 COMPLETED:
- Implemented browse-first pattern (shows 20 vehicles on page load, no filter required)
- Added "Showing X-Y of Z vehicles" count display (right-aligned in card header)
- Fixed backend pagination ([nzFrontPagination]="false" - now shows 80 pages correctly)
- Fixed pagination race condition with setTimeout wrapper
- Removed unnecessary proxy configuration (Traefik handles routing)
- Fixed CORS to allow dev server access (CORS_ORIGIN: "*")
- Fixed totalPages mapping from backend snake_case (total_pages)
- Changed dev environment to use http://autos2.minilab/api/v1 directly
- Filter winnowing working (select manufacturer → winnows to that manufacturer only)

🎯 PRIMARY GOAL FOR SESSION 7:
URL parameter sync for bookmarking and sharing:
- Sync filter state with URL query parameters (?manufacturers=Buick&page=1&size=20)
- Enable bookmarking of filtered views
- Enable sharing filtered searches via URL
- Restore filter state from URL on page load

Please orient yourself by reading:
1. NEXT-SESSION.md Session 6 section - See browse-first implementation
2. frontend/src/app/features/vehicles/services/vehicle-state.service.ts - State management
3. frontend/src/app/pages/discover/discover.component.ts - Component with working pagination

SECONDARY GOALS:
- Performance optimizations (trackBy functions for *ngFor loops)
- OnPush change detection (optional)
- Additional filter improvements (year range, multi-select)
```

---

## Session Context

### What Was Accomplished (Session 1 - 2025-10-24)
- ✅ Backend API implemented (Node.js + Express + Elasticsearch)
- ✅ Frontend scaffolded (Angular 14 + NG-ZORRO)
- ✅ Architecture documentation created (30,000+ words)
- ✅ ADR system established
- ✅ User preferences architecture decided (PostgreSQL JSONB)
- ✅ Shutdown/startup procedures documented

### What Was Accomplished (Session 2 - 2025-10-25)

**Phase 1 - Critical Fixes (TD-001, TD-002):**
- ✅ Implemented subscription cleanup with takeUntil pattern
  - Added ngOnDestroy to HomeComponent and DiscoverComponent
  - Created destroy$ Subject for proper cleanup
  - Applied takeUntil(destroy$) to all 6 subscriptions
- ✅ Created HTTP error interceptor
  - Handles 401, 403, 404, 422, 5xx errors
  - Shows user-friendly NG-ZORRO notifications
  - Retries failed requests once
  - Logs errors to console for debugging
- ✅ Created loading interceptor and service
  - LoadingService tracks active HTTP requests
  - LoadingInterceptor shows/hides spinner automatically
  - Global nz-spin component in app.component.html
  - Fixed ExpressionChangedAfterItHasBeenCheckedError

**Kubernetes Production Deployment:**
- ✅ Created production Dockerfiles
  - Backend: Multi-stage build (Node 18 Alpine, non-root user, 126MB)
  - Frontend: Multi-stage build (Node build + nginx Alpine, 50MB)
- ✅ Created nginx.conf for frontend
  - Gzip compression, security headers, caching
  - SPA routing support (try_files)
- ✅ Updated environment configs
  - Changed apiUrl to relative paths (/api/v1)
  - Works with ingress routing
- ✅ Fixed Angular budget limits (1.5MB/2MB)
- ✅ Deployed to Kubernetes
  - Namespace: autos2
  - Backend: 2 replicas, liveness/readiness probes
  - Frontend: 2 replicas, nginx serving
  - Services: ClusterIP for internal communication
  - Ingress: Traefik routing autos2.minilab
- ✅ Verified production deployment
  - All 4 pods running healthy
  - DNS configured (autos2.minilab → 192.168.0.110)
  - Full stack tested and working

**Git Commits:**
- dfebd03: Subscription cleanup
- 1b86399: HTTP error and loading interceptors
- 32ff742: Kubernetes deployment
- c4b4a22: Session documentation

### What Was Accomplished (Session 3 - 2025-10-25)

**Phase 2.1 - Vehicle State Service (TD-003):**
- ✅ Created VehicleStateService
  - BehaviorSubject pattern for all vehicle-related state
  - Manages manufacturers, models, vehicles, filters, pagination, loading
  - Public observables (read-only) for components
  - Methods: selectManufacturer(), selectModel(), updateFilters(), search(), changePage()
  - localStorage persistence (saveState/restoreState)
- ✅ Created interfaces
  - VehicleSearchFilters interface (typed search parameters)
  - Pagination interface
- ✅ Refactored DiscoverComponent
  - Now uses VehicleStateService instead of direct API calls
  - Subscribes to state observables
  - Simplified from ~165 lines to ~104 lines
  - Removed complex state management logic
- ✅ Fixed initialization bug
  - Removed auto-search from service constructor
  - Prevents NG09900 change detection error
  - Component now triggers search in ngOnInit()

**Kibana Documentation:**
- ✅ Created comprehensive kibana-reference.md (650+ lines)
  - Access URLs and deployment details
  - Complete index mapping for autos-unified
  - Field reference table (16 fields)
  - Sample document structure
  - Quick start guide
  - Common Elasticsearch queries (8 examples)
  - Troubleshooting section
- ✅ Visual walkthrough with screenshots
  - 12 screenshot placeholders created
  - Step-by-step guide from home page to document inspection
  - Screenshots directory with README
- ✅ Updated CLAUDE.md (v1.3.0 → v1.4.0)
  - Added Kibana URLs to Infrastructure section
  - Added Kibana quick reference section
  - Updated changelog

**Git Commits:**
- 981f490: Implement Phase 2.1 - Vehicle State Service
- 247901c: Fix initialization error
- 491e2ed: Add Kibana reference guide
- d944e3a: Add visual walkthrough with screenshots

### What Was Accomplished (Session 4 - 2025-10-25)

**Phase 2.2 - Async Pipe Migration (TD-004):**
- ✅ Migrated HomeComponent to async pipe pattern
  - Removed OnInit, OnDestroy lifecycle hooks
  - Removed manual subscription with takeUntil pattern
  - Exposed stats$ observable directly to template
  - Template uses `*ngIf="stats$ | async as stats"` pattern
  - Code reduced from 40 lines to 15 lines (62% reduction)
  - No more memory leak risk from manual subscriptions
- ✅ Migrated DiscoverComponent to hybrid async pipe pattern
  - Exposed 6 observables directly: manufacturers$, models$, vehicles$, availableFilters$, loading$, pagination$
  - Removed 6 manual subscriptions (kept 1 for searchFilters sync with ngModel)
  - Templates updated with async pipe for all display data
  - Added null-safe operators (||, ??) for type safety
  - Component simplified from 108 to 77 lines
- ✅ Template improvements
  - All *ngFor loops use async pipe for data sources
  - Table bindings use async pipe with default values
  - Pagination properties use optional chaining with fallbacks
  - Form controls retain two-way binding with ngModel
- ✅ Build verification
  - TypeScript compilation successful with no errors
  - Bundle size: 1.28 MB (within 1.5 MB budget)
  - Frontend Docker image built successfully

**Benefits Achieved:**
- Automatic subscription management (no manual unsubscribe needed)
- Zero memory leaks from Observable subscriptions
- Cleaner, more maintainable component code
- Ready for OnPush change detection strategy
- Follows Angular best practices from architecture guide

**Git Commits:**
- 42529a5: Implement Phase 2.2 - Migrate to Async Pipe Pattern (TD-004)

### What Was Accomplished (Session 5 - 2025-10-25)

**Phase 2.2 Production Deployment & NG0900 Error Discovery:**
- ❌ Deployed Phase 2.2 to production, discovered NG0900 errors on Discover page
  - ExpressionChangedAfterItHasBeenCheckedError preventing UI from rendering
  - Multiple errors in console related to loading$, manufacturers$, models$ observables
- ⚠️ Made 4 failed attempts to fix by deploying to k8s repeatedly (wrong approach)
  - User feedback: Redirected to use proper dev workflow with volume mounts
  - Learned: Backend is immutable (k8s), frontend developed in dev container with HMR

**Development Environment Setup:**
- ✅ Set up proper dev container workflow
  - Started dev container with volume mount: /home/odin/projects/autos2/frontend:/app:z
  - Dev server running on port 4201 (port 4200 is old working app for comparison)
  - HMR provides instant feedback (edit → save → reload)
- ✅ Created proxy configuration
  - frontend/proxy.conf.json forwards /api → http://autos2.minilab/api
  - Dev server configured with --proxy-config flag
  - Enables API calls to work during development

**NG0900/NG0100 Error Fixes (ExpressionChangedAfterItHasBeenCheckedError):**
- ✅ Fixed LoadingService NG0100 errors
  - Wrapped show() and hide() BehaviorSubject updates in setTimeout()
  - Prevents state changes during change detection cycle
- ✅ Fixed VehicleStateService NG0900 errors
  - Created updateState() helper method with setTimeout() wrapper
  - All 15+ BehaviorSubject.next() calls now wrapped in setTimeout()
  - Moved state updates outside Angular's change detection cycle
- ✅ Fixed component initialization
  - Removed initialize() call from VehicleStateService constructor
  - Made initialize() public method called from DiscoverComponent.ngAfterViewInit()
  - Ensures change detection completes before state updates begin

**API Response Type Mismatches Fixed:**
- ✅ Manufacturers endpoint mismatch
  - Backend returns: `{manufacturers: [...], total: number}`
  - Frontend expected: `Manufacturer[]`
  - Added RxJS map() to extract manufacturers array
- ✅ Models endpoint mismatch
  - Backend returns: `{manufacturer: string, models: [...], total: number}`
  - Frontend expected: `Model[]`
  - Added RxJS map() to extract models array
- ✅ Vehicles endpoint mismatch
  - Backend returns: `{vehicles: [...], pagination: {...}}`
  - Frontend expected: `{data: [...], pagination: {...}}`
  - Added RxJS map() to transform response structure

**Interface & Field Name Fixes:**
- ✅ Updated Vehicle interface to match backend
  - Changed vin → vehicle_id
  - Changed make → manufacturer
  - Added data_source, ingested_at fields
- ✅ Updated Manufacturer interface
  - Changed count → vehicle_count and model_count
- ✅ Updated Model interface
  - Changed count → vehicle_count
  - Added year_range: {min, max} structure
- ✅ Updated template field references
  - discover.component.html now uses correct field names
  - Simplified table to show: Vehicle ID, Year, Manufacturer, Model, Body Class

**Query Parameter Fixes:**
- ✅ Fixed manufacturer filter parameter
  - Backend expects: manufacturers (plural, as array)
  - Frontend was sending: manufacturer (singular)
  - Updated VehicleService to use correct parameter names
  - Filter now works correctly (e.g., "Buick" shows 27 vehicles, not all 793)

**Internationalization:**
- ✅ Configured English locale (NG-ZORRO)
  - Added NZ_I18N provider with en_US value
  - Eliminates Chinese text like "暂无数据"
  - Now shows "No Data", "Select manufacturer", etc. in English

**Testing & Verification:**
- ✅ All NG0900/NG0100 errors eliminated
- ✅ Manufacturer dropdown populates correctly (70 manufacturers)
- ✅ Vehicle table displays data correctly
- ✅ Manufacturer filtering works (tested with Buick: 27 vehicles)
- ✅ Pagination displays correctly
- ✅ All API calls return 200/304 status codes
- ✅ English UI throughout the application

**Git Commits:**
- (Pending) fix: Resolve NG0900 errors with setTimeout wrapper pattern
- (Pending) fix: Correct API response type mismatches with RxJS map()
- (Pending) fix: Update interfaces to match backend field names
- (Pending) fix: Correct query parameter names (manufacturers plural)
- (Pending) feat: Add proxy configuration for dev server
- (Pending) feat: Configure English locale for NG-ZORRO

**Files Modified:**
- frontend/src/app/app.module.ts (added NZ_I18N, en_US locale configuration)
- frontend/src/app/core/services/loading.service.ts (setTimeout wrapper)
- frontend/src/app/features/vehicles/services/vehicle-state.service.ts (updateState helper, setTimeout)
- frontend/src/app/pages/discover/discover.component.ts (moved initialization)
- frontend/src/app/pages/discover/discover.component.html (field name updates, simplified columns)
- frontend/src/app/services/vehicle.service.ts (RxJS map transforms, parameter fixes)
- frontend/proxy.conf.json (created for API proxying)

### What Was Accomplished (Session 6 - 2025-10-25)

**Browse-First Pattern Implementation:**
- ✅ Auto-load first 20 vehicles on page load without requiring filter selection
  - Search triggers automatically in ngAfterViewInit with empty filters
  - Users can immediately browse vehicles without selecting manufacturer
- ✅ Added "Showing X-Y of Z vehicles" count display
  - Positioned in card header (right-aligned using nz-card [nzExtra])
  - Helper methods: getStartRecord() and getEndRecord() for pagination display
  - Shows "Showing 1-20 of 793 vehicles" dynamically
- ✅ Filter winnowing working correctly
  - Select manufacturer → table winnows to only that manufacturer's vehicles
  - Clear filters → returns to showing all vehicles
  - Tested: Buick shows 27 vehicles (2 pages @ 20/page)

**Backend Pagination Fix:**
- ✅ Fixed pagination to show correct page count
  - Added [nzFrontPagination]="false" to enable backend pagination mode
  - Paginator now correctly shows 80 pages for 793 vehicles @ 10/page
  - Page size changes work: 10/page (80 pages), 20/page (40 pages), 50/page (16 pages)
  - Root cause: nz-table was using frontend pagination (only paginating the 10 items in [nzData])
- ✅ Fixed totalPages mapping
  - Backend returns: total_pages (snake_case)
  - Frontend expects: totalPages (camelCase)
  - Added explicit field mapping in vehicle.service.ts
- ✅ Fixed pagination race condition
  - changePageSize() was calling search() before state update completed
  - Wrapped search() call in setTimeout to ensure state updates first

**API Configuration Fixes:**
- ✅ Removed unnecessary proxy configuration
  - Deleted frontend/proxy.conf.json
  - Dev server no longer uses --proxy-config flag
  - Traefik/Ingress handles routing (as it should)
- ✅ Fixed dev environment API URL
  - Changed from: apiUrl: '/api/v1' (relative - caused CORS issues)
  - Changed to: apiUrl: 'http://autos2.minilab/api/v1' (absolute)
  - Browser makes requests directly to autos2.minilab
  - Traefik routes to backend correctly
- ✅ Fixed CORS configuration
  - Updated backend CORS_ORIGIN from "http://autos2.minilab" to "*"
  - Allows dev server at 192.168.0.244:4201 to access API
  - Production and dev both work correctly

**Production Deployment:**
- ✅ Tagged v1.0.0-session6
- ✅ Built and deployed frontend to production
  - Image: localhost/autos2-frontend:v1.0.0-session6
  - 2 pods running and healthy
- ✅ Deployed backend CORS update
  - Updated k8s/backend-deployment.yaml with CORS_ORIGIN: "*"
  - 2 pods rolled out successfully
- ✅ Verified production working
  - Browse-first pattern working at http://autos2.minilab
  - Pagination showing correct page counts
  - All API calls successful (no CORS errors)

**Git Commits:**
- 647a1de: feat: Implement browse-first pattern with vehicle count display
- f32a03f: fix: Enable backend pagination and fix API configuration

**Files Modified:**
- frontend/src/app/pages/discover/discover.component.html (added count display, nzFrontPagination)
- frontend/src/app/pages/discover/discover.component.ts (added getStartRecord/getEndRecord helpers)
- frontend/src/app/features/vehicles/services/vehicle-state.service.ts (pagination race fix)
- frontend/src/app/services/vehicle.service.ts (totalPages mapping)
- frontend/src/environments/environment.ts (apiUrl to autos2.minilab)
- k8s/backend-deployment.yaml (CORS_ORIGIN: "*")
- frontend/proxy.conf.json (deleted)

### Current State
- **Production**: http://autos2.minilab (✅ v1.0.0-session6 deployed and working)
- **Development**: http://192.168.0.244:4201 (✅ All features working - use IP not localhost)
- **Dev Container**: autos2-frontend-dev (running, volume-mounted at /app, HMR enabled)
- **Code Status**: ✅ Browse-first pattern complete, backend pagination working
- **API Status**: ✅ CORS enabled (*), Traefik routing working
- **Git**: Clean working tree, all Session 6 changes committed and tagged
- **Documentation**: NEXT-SESSION.md updated with Session 6 completion

### Technical Debt Remaining
| Priority | Item | Effort | Status |
|----------|------|--------|--------|
| ~~CRITICAL~~ | ~~Memory leaks~~ | ~~2 hrs~~ | ✅ COMPLETE |
| ~~HIGH~~ | ~~No HTTP interceptors~~ | ~~4 hrs~~ | ✅ COMPLETE |
| ~~HIGH~~ | ~~No state management~~ | ~~8 hrs~~ | ✅ COMPLETE |
| ~~HIGH~~ | ~~No async pipe usage~~ | ~~4 hrs~~ | ✅ COMPLETE |
| MEDIUM | No trackBy functions | 2 hrs | 📋 Planned |
| LOW | No OnPush change detection | 2 hrs | 📋 Optional |

### Next Steps

**IMMEDIATE (Session 7):**
1. **URL parameter sync for bookmarking** (PRIMARY GOAL)
   - Sync filter state with URL query parameters
   - Format: `?manufacturers=Buick&page=1&size=20`
   - Enables bookmarking and sharing of filtered views
   - Restore filter state from URL on page load
   - Update URL when filters change (without page reload)
   - Integrate with Angular Router's ActivatedRoute

2. **Additional filter improvements** (if time permits)
   - Add year range filter (min/max year selection)
   - Multi-select for manufacturers (currently single-select)
   - Multi-select for models
   - Body class filter improvements

**FUTURE (Phase 2 completion & beyond):**
- Performance optimizations (trackBy functions for *ngFor loops)
- OnPush change detection (optional)
- Type Safety improvements
- Advanced search features (full-text search, saved searches)
- User preferences (save filter presets)

### Important Notes
- **Container-based development**: All npm/ng commands run via `podman exec`
- **Git workflow**: Commit frequently, push to `gitlab` remote
- **Documentation**: Update ADRs for significant decisions
- **BMAD framework**: Analysis → Planning → Solutioning → Implementation

### Reference Documentation Quick Links
- [Angular Architecture](docs/design/angular-architecture.md)
- [Improvement Roadmap](docs/design/improvement-roadmap.md) - Currently on Phase 2
- [Current State Analysis](docs/design/current-state-analysis.md)
- [ADR Index](docs/design/adr/README.md)
- [Shutdown Procedures](docs/lab-environment/shutdown-startup-procedures.md)

### Files Created/Modified in Session 2

**Phase 1 - Critical Fixes:**
- Created:
  - frontend/src/app/core/interceptors/error.interceptor.ts
  - frontend/src/app/core/interceptors/loading.interceptor.ts
  - frontend/src/app/core/services/loading.service.ts
- Modified:
  - frontend/src/app/pages/home/home.component.ts (subscription cleanup)
  - frontend/src/app/pages/discover/discover.component.ts (subscription cleanup)
  - frontend/src/app/app.module.ts (register interceptors)
  - frontend/src/app/app.component.ts (LoadingService + AfterViewInit fix)
  - frontend/src/app/app.component.html (loading spinner)

**Kubernetes Deployment:**
- Created:
  - frontend/Dockerfile (production multi-stage build)
  - frontend/nginx.conf (nginx configuration)
- Modified:
  - frontend/angular.json (budget limits)
  - frontend/src/environments/environment.ts (relative API path)
  - frontend/src/environments/environment.prod.ts (relative API path)

**Kubernetes Manifests** (already existed, now deployed):
- k8s/namespace.yaml
- k8s/backend-deployment.yaml
- k8s/backend-service.yaml
- k8s/frontend-deployment.yaml
- k8s/frontend-service.yaml
- k8s/ingress.yaml

---

## Instructions for End of This Session

When ending the current session, update this file with:
1. What was accomplished
2. What's in progress (if anything)
3. What to work on next (be specific)
4. Any blockers or important context

Keep the "Copy-Paste This to Start Next Session" section at the top updated with:
- Current task focus
- Any files that need attention
- Specific next action

---

## Template for Session End Update

```markdown
### What Was Accomplished (Session N)
- ✅ [List completed items]

### What's In Progress
- ⏸️ [Any partially completed work]

### Next Session Should Focus On
- 🎯 [Specific next task]
- 📄 [Files to review/edit]
- ⚠️ [Any blockers or important context]

### Current State
- Backend: [status]
- Frontend: [status]
- Git: [branch, uncommitted changes, etc.]
```
