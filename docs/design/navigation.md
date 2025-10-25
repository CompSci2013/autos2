# Navigation and State Management Architecture

**Version**: 1.0.0
**Date**: 2025-10-25
**Status**: Active Design Document
**Context**: Session 7 - URL Parameter Sync & State Persistence

---

## Table of Contents

1. [Overview](#overview)
2. [Navigation Scenarios](#navigation-scenarios)
3. [Professional Angular Patterns](#professional-angular-patterns)
4. [State Persistence Strategy](#state-persistence-strategy)
5. [Implementation Patterns](#implementation-patterns)
6. [Current Implementation](#current-implementation)
7. [Recommendations](#recommendations)

---

## Overview

This document defines how the Autos2 application handles navigation, state persistence, and URL management to match professional Angular application patterns (Gmail, GitHub, Azure Portal, etc.).

### Design Principles

1. **URL as Source of Truth** - URLs must be bookmarkable and shareable
2. **Progressive Enhancement** - State persists across navigation when appropriate
3. **User Context Preservation** - Don't make users repeat work unnecessarily
4. **Predictable Behavior** - Consistent patterns across all features

---

## Navigation Scenarios

### 1. In-App Navigation (Same Tab, Route Change)

**Scenario**: User navigates within the application using router links.

**Examples**:
- Click "Discover" in nav menu → `/discover`
- Click "Home" in nav menu → `/home`
- Click back to "Discover" → `/discover`

**Professional App Behavior**:
- **Gmail**: Preserves sidebar collapse state, selected labels
- **GitHub**: Preserves repository search filters when navigating away and back
- **Azure Portal**: Preserves service filters, view preferences
- **Google Analytics**: Preserves date range, selected metrics

**Expected Behavior**:
```
User Journey:
1. /discover → Select manufacturer "Buick" → URL: /discover?manufacturer=Buick
2. Navigate to /home
3. Navigate back to /discover (no params in URL)

✅ SHOULD: Restore "Buick" filter (preserve user's workflow context)
✅ HOW: localStorage + URL sync on restore
```

---

### 2. Page Refresh (F5 / Cmd+R)

**Scenario**: User refreshes the current page.

**Examples**:
- Press F5 on `/discover?manufacturer=Buick&page=2`
- Press Cmd+R on `/discover`

**Professional App Behavior**:
- **Gmail**: Preserves current email, filters, sidebar state from URL + localStorage
- **GitHub**: Preserves repository view, file tree state from URL
- **Azure Portal**: Preserves resource filters, pane layouts from URL + localStorage

**Expected Behavior**:
```
Scenario A: URL with params
- URL: /discover?manufacturer=Buick&page=2
- Press F5
✅ SHOULD: Show Buick, page 2 (URL is source of truth)

Scenario B: URL without params (after in-app navigation)
- User selected "Buick" → navigated away → returned via nav menu
- URL: /discover (no params)
- Press F5
✅ SHOULD: Restore "Buick" from localStorage (preserve context)
```

---

### 3. External Link / Bookmark

**Scenario**: User clicks a shared link or uses a bookmark.

**Examples**:
- Colleague shares: `/discover?manufacturer=Buick`
- User has bookmarked: `/discover?manufacturer=Ford&body_class=Sedan`
- Search engine result links to filtered view

**Professional App Behavior**:
- **Gmail**: Direct link to email works regardless of user's localStorage
- **GitHub**: Direct link to file/line works for anyone
- **Azure Portal**: Resource deep links work universally

**Expected Behavior**:
```
User clicks: /discover?manufacturer=Buick

✅ SHOULD: Show exactly Buick vehicles (URL params take precedence)
❌ MUST NOT: Override with localStorage state
```

**Priority**: `URL params > localStorage > Defaults`

---

### 4. Browser Back/Forward Navigation

**Scenario**: User clicks browser back/forward buttons.

**Examples**:
- Buick → Ford → Chevrolet, then click back twice
- Click forward after going back

**Professional App Behavior**:
- **Gmail**: Navigates through email history
- **GitHub**: Navigates through file/commit history
- **SPA Pattern**: Browser history managed by Angular Router

**Expected Behavior**:
```
Navigation History:
1. /discover?manufacturer=Buick
2. /discover?manufacturer=Ford
3. /discover?manufacturer=Chevrolet

Click Back:
→ /discover?manufacturer=Ford ✅ (from browser history)
→ /discover?manufacturer=Buick ✅ (from browser history)

Click Forward:
→ /discover?manufacturer=Ford ✅ (from browser history)
```

**Implementation**: Angular Router + `queryParams` observable handles this automatically.

---

### 5. New Tab / Window

**Scenario**: User opens link in new tab or window.

**Examples**:
- Right-click "Discover" → Open in new tab
- Cmd+Click on navigation link
- Browser action: "Duplicate Tab"

**Professional App Behavior**:
- **Gmail**: New tab starts fresh or from URL params
- **GitHub**: New tab shows exact URL state
- **Cross-tab state**: Only for real-time collaboration (not applicable here)

**Expected Behavior**:
```
Tab A: /discover?manufacturer=Buick
Open in new tab → Tab B: /discover?manufacturer=Buick

✅ Tab B SHOULD: Show Buick from URL params
✅ OPTIONAL: Could share localStorage (same domain)
❌ NOT NEEDED: Real-time sync between tabs
```

---

### 6. Session End / Browser Restart

**Scenario**: Browser closed and reopened.

**Examples**:
- Browser crash recovery
- User closes browser, reopens next day
- "Restore Previous Session" feature

**Professional App Behavior**:
- **Gmail**: Reopens to inbox (no filter state preserved)
- **GitHub**: Reopens to last URL if session restored
- **Preferences survive**: Theme, layout, collapsed panels

**Expected Behavior**:
```
Session 1:
- User filters: /discover?manufacturer=Buick
- localStorage saves: {manufacturer: "Buick"}

Browser close/reopen (no session restore):
- User navigates to /discover (clean URL)

✅ SHOULD: Restore "Buick" from localStorage
WHY: Preserve user's work across sessions (like draft emails)
```

---

### 7. Clear Filters / Reset

**Scenario**: User explicitly clears filters.

**Examples**:
- Click "Clear Filters" button
- Clear search input

**Professional App Behavior**:
- **Gmail**: Clear search clears URL and resets view
- **GitHub**: Clear filters returns to default view
- **Explicit action**: User intention is clear

**Expected Behavior**:
```
State: /discover?manufacturer=Buick

User clicks "Clear Filters":
✅ URL: /discover (params removed)
✅ localStorage: Cleared (explicit reset)
✅ UI: All dropdowns reset
✅ Table: Shows default results
```

---

### 8. Direct URL Entry

**Scenario**: User types URL directly in address bar.

**Examples**:
- Type: `http://autos2.minilab/discover?manufacturer=Buick`
- Paste URL from documentation
- API documentation links

**Professional App Behavior**:
- **All professional apps**: URL is always respected

**Expected Behavior**:
```
User types: /discover?manufacturer=invalid-name

✅ SHOULD: Use URL params (even if invalid)
✅ SHOULD: Show "No Data" if filter returns zero results
❌ MUST NOT: Override with localStorage
```

---

### 9. Deep Links (Email, Slack, Documentation)

**Scenario**: Links shared via email, Slack, tickets, documentation.

**Examples**:
- Support ticket: "See issue at /discover?manufacturer=Buick&year=2020"
- Documentation: "Filter view example: /discover?body_class=Sedan"
- Email report: "Review these vehicles: /discover?model=Mustang"

**Professional App Behavior**:
- **GitHub**: Issue links, file links with line numbers
- **Jira**: Ticket filters, board views
- **Google Docs**: Specific page/paragraph links

**Expected Behavior**:
```
Email contains: /discover?manufacturer=Buick&body_class=Sedan

User clicks link:
✅ MUST: Show exactly Buick Sedans
❌ MUST NOT: Use localStorage state instead
```

**Critical**: This is the primary use case for URL-first design.

---

## Professional Angular Patterns

### Pattern 1: URL + localStorage Hybrid

**Used by**: Gmail, GitHub, Azure Portal, Google Analytics

**Strategy**:
```typescript
Priority Hierarchy:
1. URL params (highest) - Shareable state
2. localStorage - User session/preferences
3. Defaults - First-time visit

Implementation:
- URL params → Use immediately
- No URL params → Check localStorage
- No localStorage → Use defaults
```

**Example (Gmail)**:
- URL: `/mail/u/0/#inbox` → Shows inbox (URL-first)
- No URL, but localStorage has last folder → Restore folder
- Clean slate → Show inbox (default)

---

### Pattern 2: State Categories

Professional apps categorize state differently:

| State Type | Persistence | Example | Storage |
|------------|-------------|---------|---------|
| **Shareable State** | URL params | Current page, filters, selection | URL |
| **User Preferences** | Across sessions | Theme, language, page size | localStorage |
| **Session State** | Single session | Unsaved drafts, wizard progress | SessionStorage |
| **Transient State** | Component lifetime | Dropdown open, hover state | Component state |

---

### Pattern 3: State Restoration Rules

```typescript
// Professional pattern
function restoreState(urlParams, localStorage, defaults) {
  // 1. URL params always win (bookmarks, sharing)
  if (urlParams.hasFilters()) {
    return urlParams;
  }

  // 2. Restore from localStorage (user workflow)
  if (localStorage.hasState()) {
    const restored = localStorage.getState();
    updateUrlToMatch(restored); // Sync URL
    return restored;
  }

  // 3. Use defaults (first visit)
  return defaults;
}
```

**Key Insight**: When restoring from localStorage, **immediately sync URL** to maintain URL-first principle.

---

### Pattern 4: URL Sync Timing

Professional apps update URLs at different times:

| When | How | Why |
|------|-----|-----|
| **Immediate** | User selects filter | Preserve browser history |
| **Debounced (300ms)** | Typing in search | Avoid history spam |
| **On blur** | Text input completion | User finished editing |
| **Never** | Hover, dropdown open | Too transient |

---

## State Persistence Strategy

### Recommended Approach

```
┌─────────────────────────────────────────────────────────────┐
│                     State Flow Diagram                       │
└─────────────────────────────────────────────────────────────┘

User Action
    ↓
┌───────────────┐
│ URL Params?   │ YES → Use URL (Priority 1)
└───────────────┘
    ↓ NO
┌───────────────┐
│ localStorage? │ YES → Restore & sync URL (Priority 2)
└───────────────┘
    ↓ NO
┌───────────────┐
│ Use Defaults  │ → Empty filters (Priority 3)
└───────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│         ALL paths → Update localStorage for next time       │
└─────────────────────────────────────────────────────────────┘
```

---

### What to Persist

**✅ Persist in localStorage**:
- Selected filters (manufacturer, model, body_class, year)
- Pagination settings (page number, page size)
- Last search state
- View preferences (future: list vs. grid view)

**❌ Do NOT persist**:
- Loading states
- Error messages
- Temporary UI state (dropdown open, etc.)
- API responses (vehicles list)

---

### Storage Structure

```typescript
interface StoredState {
  version: string;           // Schema version for migrations
  filters: {
    manufacturer?: string;
    model?: string;
    body_class?: string;
    year?: number;
  };
  pagination: {
    page: number;
    limit: number;
  };
  timestamp: number;         // When saved
}

// localStorage key
const KEY = 'autos2.discover.state';
```

---

## Implementation Patterns

### Pattern A: Service-Level Persistence

```typescript
@Injectable({ providedIn: 'root' })
export class VehicleStateService {
  private readonly STORAGE_KEY = 'autos2.discover.state';

  constructor() {
    // Auto-save to localStorage when state changes
    combineLatest([this.filters$, this.pagination$])
      .pipe(
        debounceTime(500),
        distinctUntilChanged()
      )
      .subscribe(([filters, pagination]) => {
        this.saveToStorage({ filters, pagination });
      });
  }

  initialize(urlParams: any): void {
    if (urlParams && Object.keys(urlParams).length > 0) {
      // Priority 1: URL params
      this.initializeFromUrl(urlParams);
    } else {
      // Priority 2: localStorage
      const stored = this.loadFromStorage();
      if (stored) {
        this.initializeFromStorage(stored);
        // IMPORTANT: Sync URL to match restored state
        this.syncUrlToState(stored);
      }
      // Priority 3: Defaults (handled by stream startWith)
    }
  }

  private saveToStorage(state: any): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
        version: '1.0',
        ...state,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.warn('localStorage save failed', e);
    }
  }

  private loadFromStorage(): any {
    try {
      const json = localStorage.getItem(this.STORAGE_KEY);
      return json ? JSON.parse(json) : null;
    } catch (e) {
      console.warn('localStorage load failed', e);
      return null;
    }
  }
}
```

---

### Pattern B: Component URL Sync

```typescript
@Component({ /* ... */ })
export class DiscoverComponent implements OnInit {
  ngOnInit(): void {
    // Initialize from URL
    const urlParams = this.route.snapshot.queryParams;
    this.state.initialize(urlParams);

    // Subscribe to state changes and sync URL
    combineLatest([this.state.filters$, this.state.pagination$])
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(([filters, pagination]) => {
        this.updateUrl(filters, pagination);
      });
  }

  private updateUrl(filters: any, pagination: any): void {
    const params: any = {};

    // Only add non-default values
    if (filters.manufacturer) params.manufacturer = filters.manufacturer;
    if (pagination.page !== 1) params.page = pagination.page;
    // ...etc

    this.router.navigate([], {
      queryParams: params,
      replaceUrl: false // Enable history
    });
  }
}
```

---

### Pattern C: Storage Versioning

```typescript
// Handle schema migrations
private loadFromStorage(): any {
  const stored = localStorage.getItem(this.STORAGE_KEY);
  if (!stored) return null;

  const data = JSON.parse(stored);

  // Migrate old schemas
  if (!data.version || data.version < '1.0') {
    return this.migrateV0toV1(data);
  }

  return data;
}

private migrateV0toV1(oldData: any): any {
  // Example: rename 'make' to 'manufacturer'
  return {
    version: '1.0',
    filters: {
      manufacturer: oldData.filters?.make,
      // ... other migrations
    }
  };
}
```

---

## Current Implementation

### ✅ What Works Now

1. **URL-first for bookmarks**: External links always work correctly
2. **In-app navigation preserves context**: Home → Discover restores filters
3. **Browser back/forward**: Works via Angular Router
4. **Clear filters**: Clears UI and URL params

### ⚠️ What's Missing

1. **Page refresh loses state**: F5 on `/discover` loses filters (unless in URL)
2. **No localStorage**: Using only in-memory session state
3. **URL doesn't sync on restore**: When restoring session memory, URL stays empty

### Current Code

```typescript
// vehicle-state.service.ts (current)
export class VehicleStateService {
  // In-memory only (lost on refresh)
  private lastSessionState: {filters, pagination} | null = null;

  initialize(urlParams: any): void {
    if (urlParams && Object.keys(urlParams).length > 0) {
      // Use URL
    } else if (this.lastSessionState) {
      // Use session memory (in-memory only!)
    }
    // No localStorage fallback
  }
}
```

**Issue**: Session state is lost on page refresh because it's just a variable.

---

## Recommendations

### Recommendation 1: Add localStorage Persistence ⭐

**Change**: Replace in-memory `lastSessionState` with `localStorage`

**Benefits**:
- ✅ State survives page refresh (like professional apps)
- ✅ State survives browser restart
- ✅ Matches Gmail/GitHub/Azure patterns

**Implementation**:
```typescript
// Replace this:
private lastSessionState: {...} | null = null;

// With this:
private readonly STORAGE_KEY = 'autos2.discover.state';

private saveToLocalStorage(state): void {
  localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
}

private loadFromLocalStorage(): any {
  const json = localStorage.getItem(this.STORAGE_KEY);
  return json ? JSON.parse(json) : null;
}
```

---

### Recommendation 2: Sync URL When Restoring ⭐

**Change**: When restoring from localStorage, update URL immediately

**Why**: Maintains URL-first principle (URL always reflects current state)

**Implementation**:
```typescript
initialize(urlParams: any): void {
  if (urlParams && Object.keys(urlParams).length > 0) {
    // Use URL (Priority 1)
    this.initializeFromUrl(urlParams);
  } else {
    // Load from localStorage (Priority 2)
    const stored = this.loadFromLocalStorage();
    if (stored) {
      this.initializeFromStorage(stored.filters);

      // ⭐ IMPORTANT: Sync URL to match restored state
      // This happens in component's combineLatest subscription
      // URL will update to ?manufacturer=Buick after debounce
    }
  }
}
```

---

### Recommendation 3: Add Storage Expiration (Optional)

**Change**: Add timestamp to stored state, ignore if too old

**Why**: Prevents stale filters from confusing users

**Implementation**:
```typescript
private loadFromLocalStorage(): any {
  const stored = /* ... */;

  // Expire after 7 days
  const MAX_AGE = 7 * 24 * 60 * 60 * 1000;
  if (Date.now() - stored.timestamp > MAX_AGE) {
    localStorage.removeItem(this.STORAGE_KEY);
    return null;
  }

  return stored;
}
```

---

### Recommendation 4: Add Clear Storage Method

**Change**: Clear localStorage when user clears filters

**Why**: Explicit user action = clear saved state

**Implementation**:
```typescript
clearFilters(): void {
  this.clearFiltersAction$.next();
  // Also clear localStorage
  localStorage.removeItem(this.STORAGE_KEY);
}
```

---

## Navigation Test Matrix

Use this matrix to verify professional behavior:

| Scenario | URL | localStorage | Expected Result |
|----------|-----|--------------|-----------------|
| **Fresh visit** | None | None | Default (20 vehicles) |
| **Bookmark** | `?manufacturer=Buick` | Any | Buick (URL wins) |
| **In-app nav** | None | `{Buick}` | Buick + URL syncs |
| **Refresh with URL** | `?manufacturer=Ford` | `{Buick}` | Ford (URL wins) |
| **Refresh no URL** | None | `{Buick}` | Buick + URL syncs |
| **Clear filters** | None | `{Buick}` | Default + localStorage cleared |
| **Browser restart** | None | `{Buick}` | Buick (persisted) |
| **New tab** | `?manufacturer=Ford` | `{Buick}` | Ford (URL wins) |

---

## References

### Professional Apps Analyzed

- **Gmail**: URL params for mail ID + localStorage for sidebar state
- **GitHub**: URL params for navigation + localStorage for preferences
- **Azure Portal**: Deep URL params + localStorage for layout
- **Google Analytics**: URL params for reports + localStorage for settings
- **Linear**: URL params for issues + localStorage for recent searches

### Angular Patterns

- [Angular Router State Management](https://angular.io/guide/router#router-state)
- [localStorage Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [URL Design Best Practices](https://www.w3.org/Provider/Style/URI)

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-10-25 | Initial document - Session 7 architecture |

---

## Next Steps

1. ✅ **Review this document** - Does it match professional app expectations?
2. 🔄 **Implement localStorage** - Replace session state with localStorage
3. ✅ **Add URL sync on restore** - Update URL when restoring from storage
4. ✅ **Add storage versioning** - Prepare for future schema changes
5. ✅ **Test all scenarios** - Use test matrix to verify behavior

---

**Document Owner**: Architecture Team
**Last Reviewed**: 2025-10-25
**Status**: Awaiting approval for localStorage implementation
