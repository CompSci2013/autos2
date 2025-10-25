# Claude Code Session Start Prompt

**Last Updated**: 2025-10-25 (Session 5 Complete - NG0900 Fixed, Manufacturer Filtering Working)

---

## Copy-Paste This to Start Next Session

```
Hello Claude. I'm resuming work on the Autos2 project.

Project: Autos2 - Vehicle database application (Angular 14 + Node.js + Elasticsearch)
Location: /home/odin/projects/autos2
Git Branch: main
Production URL: http://autos2.minilab
Dev URL: http://localhost:4201

Application Status: ✅ DEVELOPMENT WORKING - Ready for Browse-First Pattern
- Production: Running at http://autos2.minilab (⚠️ needs deployment - has old NG0900 errors)
- Development: http://localhost:4201 (✅ All fixes working - no errors)
- Backend API: http://autos2.minilab/api/v1 (2 replicas, healthy)
- Dev Container: autos2-frontend-dev (running with /home/odin/projects/autos2/frontend:/app:z)

✅ SESSION 5 COMPLETED:
- Fixed all NG0900/NG0100 errors (ExpressionChangedAfterItHasBeenCheckedError)
- Fixed all API response type mismatches (manufacturers, models, vehicles)
- Fixed interface field name mismatches (vehicle_id, manufacturer, vehicle_count, etc.)
- Fixed query parameter names (manufacturer → manufacturers plural)
- Configured English locale for NG-ZORRO (eliminates Chinese text)
- Created proxy configuration for dev server
- Manufacturer filtering working correctly (tested: Buick shows 27 vehicles)
- All API calls returning 200/304 status codes
- Dev environment with HMR working properly

🎯 PRIMARY GOAL FOR SESSION 6:
Implement "browse-first" filter pattern:
- Table should show initial 20 vehicles WITHOUT requiring manufacturer selection
- Currently table is empty until user selects a manufacturer
- Auto-trigger search on page load with empty filters
- Add "Showing X-Y of Z vehicles" count display
- Test filter winnowing (select Ford → winnows to Ford vehicles only)

Please orient yourself by reading:
1. frontend/src/app/features/vehicles/services/vehicle-state.service.ts - State management
2. frontend/src/app/pages/discover/discover.component.ts - Component initialization
3. NEXT-SESSION.md Session 5 section - See all fixes applied

SECONDARY GOALS:
- Deploy Session 5 fixes to production (build + k8s deployment)
- Consider URL parameter sync for bookmarking (like old app)
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

### Current State
- **Production**: http://autos2.minilab (⚠️ Needs deployment - has old code with NG0900 errors)
- **Development**: http://localhost:4201 (✅ WORKING - all fixes verified)
- **Dev Container**: autos2-frontend-dev (running, volume-mounted at /app)
- **Code Status**: ✅ All NG0900 errors fixed, manufacturer filtering working
- **Proxy Status**: ✅ Working correctly (forwards /api to backend)
- **Git**: Ready to commit Session 5 fixes (7 modified files + 1 new file)
- **Documentation**: NEXT-SESSION.md updated with Session 5 completion

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

**IMMEDIATE (Session 6):**
1. **Implement browse-first pattern** (PRIMARY GOAL from Session 5)
   - Table should show initial 20 vehicles WITHOUT requiring manufacturer selection
   - Currently table is empty until user selects a manufacturer
   - Auto-trigger search on page load with empty filters
   - Add "Showing X-Y of Z vehicles" count display
   - Test filter winnowing behavior (select Ford → see only Ford vehicles)

2. **Deploy Session 5 fixes to production**
   - Build new frontend Docker image with all fixes
   - Deploy to k8s cluster
   - Verify NG0900 errors are resolved in production
   - Verify manufacturer filtering works in production

3. **URL parameter sync** (nice-to-have)
   - Old app had URL params like: `?manufacturers=Buick&page=1&size=20`
   - Enables bookmarking and sharing filtered views
   - Sync Angular router params with VehicleStateService

4. **Consider pagination improvements**
   - Current paginator shows page selector
   - Verify it works correctly with different manufacturers
   - Test page size changes (10, 20, 50, 100)

**FUTURE (Phase 2 completion):**
- Phase 2.3: OnPush change detection (optional)
- Phase 3: Type Safety improvements
- Phase 4: Performance optimizations (trackBy functions)

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
