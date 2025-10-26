# Phase 6.2: Year Range Selector

**Status**: 📋 Planned
**Priority**: 🟡 HIGH (Backend already supports it!)
**Effort Estimate**: 3 hours
**Dependencies**: None (backend ready with year_min/year_max)
**Inspired By**: Legacy Autos application Discover page

---

## Problem Statement

### Current Limitations
1. **Single Year Only**: Users must select exactly one year (e.g., 1975)
2. **Tedious for Ranges**: Cannot explore "1960s vehicles" in one query
3. **Backend Underutilized**: API supports `year_min`/`year_max` but UI doesn't expose it
4. **Missing UX**: Legacy app had dual From/To selectors

### User Impact
- **Decade browsing** is cumbersome (need 10 separate searches)
- **Era analysis** (e.g., "muscle car era 1964-1974") not possible
- **Data exploration** limited to year-by-year

---

## Solution Overview

Replace single year dropdown with **dual From/To year selectors**, allowing users to specify a year range in one interaction.

### Design Options

#### Option A: Dual Dropdowns (Recommended)
**Pros**:
- More accessible (keyboard navigation, screen readers)
- Precise selection (exact years)
- Familiar pattern
- Easier to implement (3 hours)

**Cons**:
- Slightly more verbose UI
- Two clicks instead of one drag

#### Option B: Range Slider
**Pros**:
- Visual, intuitive
- Single interaction
- Looks modern

**Cons**:
- Less accessible
- Hard to select exact years (e.g., 1967 specifically)
- More complex to implement (5 hours)

**Decision**: Option A (Dual Dropdowns) for accessibility and simplicity.

---

## Technical Design

### 1. Component Template

```html
<!-- frontend/src/app/pages/discover/discover.component.html -->

<nz-collapse-panel
  [nzHeader]="'Year Range' + getYearRangeLabel()"
  [nzActive]="false">

  <nz-form-item>
    <nz-form-label>Select Year Range</nz-form-label>
    <nz-form-control>
      <div style="display: flex; gap: 8px; align-items: center;">
        <!-- From Year Dropdown -->
        <nz-select
          [(ngModel)]="yearMin"
          [nzPlaceHolder]="'From Year'"
          [nzShowSearch]="true"
          [nzAllowClear]="true"
          style="width: 140px;">
          <nz-option
            *ngFor="let year of years"
            [nzValue]="year"
            [nzLabel]="year.toString()">
          </nz-option>
        </nz-select>

        <span style="color: rgba(0,0,0,0.45);">to</span>

        <!-- To Year Dropdown -->
        <nz-select
          [(ngModel)]="yearMax"
          [nzPlaceHolder]="'To Year'"
          [nzShowSearch]="true"
          [nzAllowClear]="true"
          style="width: 140px;">
          <nz-option
            *ngFor="let year of years"
            [nzValue]="year"
            [nzLabel]="year.toString()">
          </nz-option>
        </nz-select>

        <!-- Quick Presets (Optional Enhancement) -->
        <nz-button-group>
          <button nz-button nzSize="small" (click)="setYearRange(1960, 1969)">60s</button>
          <button nz-button nzSize="small" (click)="setYearRange(1970, 1979)">70s</button>
          <button nz-button nzSize="small" (click)="setYearRange(1980, 1989)">80s</button>
        </nz-button-group>
      </div>

      <!-- Validation Warning -->
      <div
        *ngIf="yearMin && yearMax && yearMin > yearMax"
        style="color: #ff4d4f; margin-top: 4px;">
        <i nz-icon nzType="warning" nzTheme="fill"></i>
        "From Year" cannot be greater than "To Year"
      </div>

      <!-- Current Selection Display -->
      <div
        *ngIf="yearMin || yearMax"
        style="margin-top: 8px; color: rgba(0,0,0,0.65);">
        Showing vehicles from
        <strong>{{ yearMin || 'earliest' }}</strong>
        to
        <strong>{{ yearMax || 'latest' }}</strong>
      </div>
    </nz-form-control>
  </nz-form-item>
</nz-collapse-panel>
```

### 2. Component Logic

```typescript
// frontend/src/app/pages/discover/discover.component.ts

export class DiscoverComponent implements AfterViewInit {
  // Year range state
  yearMin: number | null = null;
  yearMax: number | null = null;

  // Year options (1900-2025)
  years: number[] = [];

  constructor(private vehicleState: VehicleStateService) {
    // Generate year list (reverse chronological for dropdown)
    const currentYear = new Date().getFullYear();
    for (let year = currentYear; year >= 1900; year--) {
      this.years.push(year);
    }
  }

  ngAfterViewInit(): void {
    // Restore year range from state
    this.vehicleState.filters$.pipe(take(1)).subscribe(filters => {
      this.yearMin = filters.year_min || null;
      this.yearMax = filters.year_max || null;
    });
  }

  onApply(): void {
    // Validate before applying
    if (this.yearMin && this.yearMax && this.yearMin > yearMax) {
      this.notification.error('Invalid Range', '"From Year" cannot be greater than "To Year"');
      return;
    }

    this.vehicleState.updateFilters({
      year_min: this.yearMin || undefined,
      year_max: this.yearMax || undefined
    });
  }

  setYearRange(min: number, max: number): void {
    this.yearMin = min;
    this.yearMax = max;
    // Auto-apply preset ranges (optional behavior)
    this.onApply();
  }

  getYearRangeLabel(): string {
    if (!this.yearMin && !this.yearMax) return '';
    if (this.yearMin && this.yearMax) return ` (${this.yearMin}-${this.yearMax})`;
    if (this.yearMin) return ` (${this.yearMin}+)`;
    if (this.yearMax) return ` (≤${this.yearMax})`;
    return '';
  }
}
```

### 3. Active Filter Badge

```html
<!-- Show year range as badge -->
<nz-tag
  *ngIf="(appliedFilters$ | async)?.year_min || (appliedFilters$ | async)?.year_max"
  nzMode="closeable"
  (nzOnClose)="removeYearRange()">
  Year: {{ getYearRangeDisplay() }}
</nz-tag>
```

```typescript
getYearRangeDisplay(): string {
  const filters = this.appliedFilters$.value;
  if (filters.year_min && filters.year_max) {
    return `${filters.year_min}-${filters.year_max}`;
  }
  if (filters.year_min) {
    return `${filters.year_min}+`;
  }
  if (filters.year_max) {
    return `≤${filters.year_max}`;
  }
  return '';
}

removeYearRange(): void {
  this.yearMin = null;
  this.yearMax = null;
  this.vehicleState.updateFilters({
    year_min: undefined,
    year_max: undefined
  });
}
```

---

## Backend Changes

**NO BACKEND CHANGES NEEDED!** Backend already supports `year_min` and `year_max` parameters.

Current backend code:
```typescript
// backend/src/services/vehicle.service.ts (ALREADY EXISTS)

if (filters.year_min || filters.year_max) {
  query.bool.must.push({
    range: {
      year: {
        gte: filters.year_min,  // ✅ Already implemented
        lte: filters.year_max   // ✅ Already implemented
      }
    }
  });
}
```

---

## Testing Strategy

### Unit Tests

```typescript
describe('DiscoverComponent - Year Range', () => {
  it('should validate yearMin <= yearMax', () => {
    component.yearMin = 1970;
    component.yearMax = 1960;

    component.onApply();

    expect(notificationService.error).toHaveBeenCalledWith(
      'Invalid Range',
      jasmine.stringContaining('cannot be greater')
    );
  });

  it('should apply year range filter correctly', () => {
    component.yearMin = 1960;
    component.yearMax = 1970;

    component.onApply();

    expect(vehicleState.updateFilters).toHaveBeenCalledWith({
      year_min: 1960,
      year_max: 1970
    });
  });

  it('should handle open-ended ranges (min only)', () => {
    component.yearMin = 1975;
    component.yearMax = null;

    component.onApply();

    expect(vehicleState.updateFilters).toHaveBeenCalledWith({
      year_min: 1975,
      year_max: undefined
    });
  });

  it('should display year range label correctly', () => {
    component.yearMin = 1960;
    component.yearMax = 1969;

    expect(component.getYearRangeLabel()).toBe(' (1960-1969)');
  });
});
```

### Manual Testing Checklist

- [ ] Select From=1960, To=1970 → Results show only 1960-1970 vehicles
- [ ] Select From=1960, To=empty → Results show 1960+ vehicles
- [ ] Select From=empty, To=1970 → Results show ≤1970 vehicles
- [ ] Select From=1970, To=1960 → Validation error shown
- [ ] Click "60s" preset → Auto-applies 1960-1969 range
- [ ] Clear year range badge → Removes filter, shows all years
- [ ] Year range persists across page refresh
- [ ] Year range syncs to URL: `?year_min=1960&year_max=1970`

---

## UX Enhancements (Optional)

### 1. Decade Presets
Add quick buttons for common ranges:
- 50s, 60s, 70s, 80s, 90s, 2000s, 2010s, 2020s
- "Classic" (pre-1980), "Modern" (2000+)

### 2. Visual Year Distribution
Show histogram of vehicle counts by year to help users understand dataset:
```
1960 ████████ 45
1965 ████████████ 72
1970 ██████ 34
1975 ████████████████ 98
```

### 3. Keyboard Shortcuts
- Arrow keys to adjust year +/- 1
- Shift+Arrow for +/- 10 years

---

## Migration Path

Since this is a pure additive change:

1. **Deploy immediately** after implementation (no breaking changes)
2. **Deprecate single-year dropdown** gradually:
   - Phase 1: Show both (side-by-side) for 1 sprint
   - Phase 2: Hide single-year, keep code for 1 sprint
   - Phase 3: Remove single-year code
3. **Or**: Replace single-year immediately (recommended since UI is clearer)

---

## Success Criteria

- [ ] Users can select year ranges (From/To)
- [ ] Validation prevents invalid ranges (From > To)
- [ ] Open-ended ranges work (From-only, To-only)
- [ ] Quick presets (60s, 70s, etc.) work
- [ ] Year range displays in panel header and badge
- [ ] Filter persists to localStorage and URL
- [ ] Backend receives correct year_min/year_max parameters
- [ ] Results winnow correctly based on range
- [ ] All existing year filter tests still pass

---

## References

- Legacy Autos screenshots (Discover page year filter)
- NG-ZORRO Select: https://ng.ant.design/components/select/en
- Backend API: Already supports year_min/year_max (no changes needed)
