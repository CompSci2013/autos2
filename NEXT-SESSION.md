# Claude Code Session Start Prompt

**Last Updated**: 2025-10-24 (End of Session 1 - Initial Setup)

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
2. docs/design/current-state-analysis.md - Current implementation gaps
3. docs/design/improvement-roadmap.md - Phased improvement plan
4. docs/design/adr/adr-005-user-preferences-storage.md - Recent architectural decision

Current Task: Ready to begin Phase 1 improvements from the roadmap

Phase 1 (Week 1) - Critical Fixes:
- [ ] Implement subscription cleanup (ngOnDestroy) in all components
- [ ] Create HTTP error interceptor
- [ ] Create loading interceptor

Please review the current state and help me implement Phase 1.1
(Subscription Cleanup) from docs/design/improvement-roadmap.md.

Let me know when you're oriented and ready to begin.
```

---

## Session Context

### What Was Accomplished (Session 1)
- ✅ Backend API implemented (Node.js + Express + Elasticsearch)
- ✅ Frontend scaffolded (Angular 14 + NG-ZORRO)
- ✅ Architecture documentation created (30,000+ words)
- ✅ ADR system established
- ✅ User preferences architecture decided (PostgreSQL JSONB)
- ✅ Shutdown/startup procedures documented

### Current State
- Backend: http://localhost:3000/api/v1 (running in container)
- Frontend: http://localhost:4201 (running in container)
- Git: All work committed and pushed to GitLab
- Documentation: Complete and up-to-date

### Technical Debt Identified
| Priority | Item | Effort | Location |
|----------|------|--------|----------|
| CRITICAL | Memory leaks (no ngOnDestroy) | 2 hrs | home.component.ts, discover.component.ts |
| HIGH | No HTTP interceptors | 4 hrs | Need to create core/interceptors/ |
| HIGH | No state management | 8 hrs | Need VehicleStateService |
| MEDIUM | No async pipe usage | 4 hrs | All component templates |

### Next Steps (Prioritized)
1. **Implement subscription cleanup** (TD-001) - START HERE
2. Create error interceptor (TD-002)
3. Create loading interceptor (TD-002)
4. Implement VehicleStateService (TD-003)
5. Migrate to async pipe pattern (TD-004)

### Important Notes
- **Container-based development**: All npm/ng commands run via `podman exec`
- **Git workflow**: Commit frequently, push to `gitlab` remote
- **Documentation**: Update ADRs for significant decisions
- **BMAD framework**: Analysis → Planning → Solutioning → Implementation

### Reference Documentation Quick Links
- [Angular Architecture](docs/design/angular-architecture.md)
- [Current State Analysis](docs/design/current-state-analysis.md) - Shows all gaps
- [Improvement Roadmap](docs/design/improvement-roadmap.md) - Phase 1 details
- [ADR Index](docs/design/adr/README.md)
- [Shutdown Procedures](docs/lab-environment/shutdown-startup-procedures.md)

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
