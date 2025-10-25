# Claude Code Session Start Prompt

**Last Updated**: 2025-10-25 (End of Session 2 - Phase 1 Complete)

---

## Copy-Paste This to Start Next Session

```
Hello Claude. I'm resuming work on the Autos2 project.

Project: Autos2 - Vehicle database application (Angular 14 + Node.js + Elasticsearch)
Location: /home/odin/projects/autos2
Git Branch: main
Services Status: [Check with ./check-autos2-status.sh before starting Claude]

Please orient yourself by reading these key files:
1. docs/design/angular-architecture.md - Architecture patterns and best practices
2. docs/design/improvement-roadmap.md - Phased improvement plan (currently on Phase 2)
3. docs/design/current-state-analysis.md - Current implementation gaps

Current Status: Phase 1 (Critical Fixes) COMPLETE!

Phase 1 Completed Items:
- ✅ Subscription cleanup with takeUntil pattern (TD-001)
- ✅ HTTP error interceptor with user notifications (TD-002)
- ✅ Global loading interceptor and spinner (TD-002)

Next Task: Begin Phase 2 - State Management (Week 2)

Phase 2 Goals:
- [ ] Create VehicleStateService with BehaviorSubject pattern (TD-003)
- [ ] Migrate components to use state service instead of direct API calls
- [ ] Migrate templates to async pipe pattern (TD-004)

Please review the roadmap and help me implement Phase 2.1
(Create Vehicle State Service) from docs/design/improvement-roadmap.md.

Let me know when you're oriented and ready to begin.
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
- ✅ Created core/ directory structure
  - core/interceptors/
  - core/services/
- ✅ All changes committed to git (2 commits)

### Current State
- Backend: http://localhost:3000/api/v1 (running and healthy)
- Frontend: http://localhost:4201 (running and compiled)
- Git: All Phase 1 work committed to main branch
- Documentation: Up-to-date

### Technical Debt Remaining
| Priority | Item | Effort | Status |
|----------|------|--------|--------|
| ~~CRITICAL~~ | ~~Memory leaks~~ | ~~2 hrs~~ | ✅ COMPLETE |
| ~~HIGH~~ | ~~No HTTP interceptors~~ | ~~4 hrs~~ | ✅ COMPLETE |
| HIGH | No state management | 8 hrs | 🎯 NEXT |
| HIGH | No async pipe usage | 4 hrs | 📋 Planned |
| MEDIUM | No trackBy functions | 2 hrs | 📋 Planned |

### Next Steps (Phase 2 - State Management)
1. **Create VehicleStateService** (TD-003) - START HERE
   - Implement BehaviorSubject pattern for manufacturers, models, vehicles
   - Add state persistence to localStorage
   - Handle loading state centrally
2. Refactor components to use VehicleStateService
3. Migrate templates to async pipe pattern (TD-004)

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
**Created:**
- frontend/src/app/core/interceptors/error.interceptor.ts
- frontend/src/app/core/interceptors/loading.interceptor.ts
- frontend/src/app/core/services/loading.service.ts

**Modified:**
- frontend/src/app/pages/home/home.component.ts (subscription cleanup)
- frontend/src/app/pages/discover/discover.component.ts (subscription cleanup)
- frontend/src/app/app.module.ts (register interceptors)
- frontend/src/app/app.component.ts (inject LoadingService)
- frontend/src/app/app.component.html (add loading spinner)

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
