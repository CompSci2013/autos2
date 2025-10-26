# Phase 6.1: Multi-Select Filters with Apply Pattern

**Status**: 📋 Planned
**Priority**: 🟡 HIGH (UX Parity with legacy app)
**Effort Estimate**: 8 hours
**Dependencies**: None
**Inspired By**: Legacy Autos application Discover page

---

## Problem Statement

### Current Limitations
1. **Single Selection Only**: Users can only select one manufacturer or model at a time
2. **Immediate Search**: Every filter change triggers an API call, causing:
   - Unnecessary network traffic
   - Slower user experience when adjusting multiple filters
   - Higher backend load
3. **No Batch Operations**: Cannot explore combinations like "Buick + Cadillac sedans from 1960-1970"
4. **Missing UX Pattern**: Legacy app users expect checkbox-based multi-select

### User Impact
- **Power users** frustrated by inability to compare multiple manufacturers
- **Data explorers** want to see combined result sets
- **Research users** need to analyze vehicle distributions across categories

---

## Solution Overview

Implement checkbox-based multi-select filters with an explicit "Apply" button to batch-execute searches, matching the UX pattern from the legacy Autos application.

### Key Features
1. Checkbox groups for manufacturers, models, and body classes
2. "Apply (count)" button showing number of active selections
3. "Clear" button to reset all filters
4. Active filter badges/chips display
5. Expandable/collapsible filter panels (accordion)

---

## Technical Design

### 1. Interface Changes

#### Updated VehicleSearchFilters Interface
```typescript
// frontend/src/app/core/models/vehicle.model.ts

export interface VehicleSearchFilters {
  // Changed from singular to arrays
  manufacturers?: string[];  // Was: manufacturer?: string;
  models?: string[];         // Was: model?: string;
  body_classes?: string[];   // New field

  // Year range unchanged
  year_min?: number;
  year_max?: number;

  // Sorting unchanged
  sort?: string;
  order?: 'asc' | 'desc';
}
```

#### Component State
```typescript
// frontend/src/app/pages/discover/discover.component.ts

export class DiscoverComponent implements AfterViewInit {
  // Local selection state (not yet applied)
  selectedManufacturers: string[] = [];
  selectedModels: string[] = [];
  selectedBodyClasses: string[] = [];

  // Applied filters (from service, shown as badges)
  appliedFilters$ = this.vehicleState.filters$;

  // Count of pending selections
  get pendingFilterCount(): number {
    return this.selectedManufacturers.length +
           this.selectedModels.length +
           this.selectedBodyClasses.length;
  }

  // Check if current selection differs from applied
  get hasUnappliedChanges(): boolean {
    const applied = this.appliedFilters$.value;
    return !this.arraysEqual(this.selectedManufacturers, applied.manufacturers) ||
           !this.arraysEqual(this.selectedModels, applied.models) ||
           !this.arraysEqual(this.selectedBodyClasses, applied.body_classes);
  }
}
```

### 2. Backend API Contract

#### GET /api/v1/vehicles (Updated)

**Query Parameters**:
```
manufacturers: string (comma-separated) - e.g., "Buick,Cadillac,Ford"
models: string (comma-separated) - e.g., "Sedan,Coupe"
body_classes: string (comma-separated) - e.g., "luxury,sport"
year_min: number
year_max: number
page: number
limit: number
sort: string
order: string
```

**Example Request**:
```
GET /api/v1/vehicles?manufacturers=Buick,Cadillac&year_min=1960&year_max=1970&page=1&limit=20
```

**Backend Implementation** (Node.js + Elasticsearch):
```typescript
// backend/src/services/vehicle.service.ts

async searchVehicles(filters: VehicleSearchFilters): Promise<VehicleSearchResponse> {
  const query: any = { bool: { must: [] } };

  // Multi-value manufacturer filter (OR logic within field)
  if (filters.manufacturers && filters.manufacturers.length > 0) {
    query.bool.must.push({
      terms: { manufacturer: filters.manufacturers }
    });
  }

  // Multi-value model filter (OR logic within field)
  if (filters.models && filters.models.length > 0) {
    query.bool.must.push({
      terms: { model: filters.models }
    });
  }

  // Multi-value body class filter (OR logic within field)
  if (filters.body_classes && filters.body_classes.length > 0) {
    query.bool.must.push({
      terms: { body_class: filters.body_classes }
    });
  }

  // Year range (unchanged)
  if (filters.year_min || filters.year_max) {
    query.bool.must.push({
      range: {
        year: {
          gte: filters.year_min,
          lte: filters.year_max
        }
      }
    });
  }

  // Execute search...
}
```

### 3. Component Template

```html
<!-- frontend/src/app/pages/discover/discover.component.html -->

<nz-card nzTitle="Search Filters">
  <nz-collapse [nzBordered]="false">

    <!-- Manufacturer + Model Panel -->
    <nz-collapse-panel
      [nzHeader]="'Manufacturer + Model' + getFilterCountBadge('manufacturers')"
      [nzActive]="true">

      <div nz-row [nzGutter]="16">
        <!-- Manufacturers Column -->
        <div nz-col [nzSpan]="12">
          <h4>Manufacturers ({{ (manufacturers$ | async)?.length || 0 }})</h4>
          <nz-input-group [nzPrefix]="prefixIconSearch">
            <input
              nz-input
              [(ngModel)]="manufacturerSearchTerm"
              placeholder="Search manufacturers..."
              (ngModelChange)="filterManufacturers()" />
          </nz-input-group>

          <div style="max-height: 300px; overflow-y: auto; margin-top: 8px;">
            <label
              nz-checkbox
              *ngFor="let mfr of filteredManufacturers$ | async"
              [(ngModel)]="selectedManufacturers"
              [nzValue]="mfr.name"
              style="display: block; margin: 4px 0;">
              {{ mfr.name }} ({{ mfr.vehicle_count }})
            </label>
          </div>
        </div>

        <!-- Models Column (filtered by selected manufacturers) -->
        <div nz-col [nzSpan]="12">
          <h4>Models ({{ (availableModels$ | async)?.length || 0 }})</h4>
          <nz-input-group [nzPrefix]="prefixIconSearch">
            <input
              nz-input
              [(ngModel)]="modelSearchTerm"
              placeholder="Search models..."
              (ngModelChange)="filterModels()" />
          </nz-input-group>

          <div style="max-height: 300px; overflow-y: auto; margin-top: 8px;">
            <nz-empty
              *ngIf="selectedManufacturers.length === 0"
              [nzNotFoundContent]="'Select a manufacturer first'">
            </nz-empty>

            <label
              nz-checkbox
              *ngFor="let model of filteredModels$ | async"
              [(ngModel)]="selectedModels"
              [nzValue]="model.name"
              style="display: block; margin: 4px 0;">
              {{ model.name }} ({{ model.vehicle_count }})
            </label>
          </div>
        </div>
      </div>
    </nz-collapse-panel>

    <!-- Year Range Panel -->
    <nz-collapse-panel
      [nzHeader]="'Year Range' + getFilterCountBadge('year')"
      [nzActive]="false">
      <!-- Year range selector (from Phase 6.2) -->
    </nz-collapse-panel>

    <!-- Body Class Panel -->
    <nz-collapse-panel
      [nzHeader]="'Body Class' + getFilterCountBadge('body_classes')"
      [nzActive]="false">

      <label
        nz-checkbox
        *ngFor="let bodyClass of bodyClasses$ | async"
        [(ngModel)]="selectedBodyClasses"
        [nzValue]="bodyClass.name"
        style="display: block; margin: 4px 0;">
        {{ bodyClass.name }} ({{ bodyClass.count }})
      </label>
    </nz-collapse-panel>

  </nz-collapse>

  <!-- Action Buttons -->
  <div nz-row [nzGutter]="16" style="margin-top: 16px;">
    <div nz-col [nzSpan]="12">
      <button
        nz-button
        nzType="primary"
        nzBlock
        [disabled]="!hasUnappliedChanges"
        (click)="onApply()">
        <i nz-icon nzType="search"></i>
        Apply{{ pendingFilterCount > 0 ? ' (' + pendingFilterCount + ')' : '' }}
      </button>
    </div>
    <div nz-col [nzSpan]="12">
      <button
        nz-button
        nzBlock
        (click)="onClear()">
        <i nz-icon nzType="clear"></i>
        Clear All
      </button>
    </div>
  </div>

  <!-- Active Filter Badges -->
  <div *ngIf="(appliedFilters$ | async) as filters" style="margin-top: 16px;">
    <nz-tag
      *ngFor="let mfr of filters.manufacturers"
      nzMode="closeable"
      (nzOnClose)="removeFilter('manufacturer', mfr)">
      Manufacturer: {{ mfr }}
    </nz-tag>
    <nz-tag
      *ngFor="let model of filters.models"
      nzMode="closeable"
      (nzOnClose)="removeFilter('model', model)">
      Model: {{ model }}
    </nz-tag>
    <nz-tag
      *ngFor="let bodyClass of filters.body_classes"
      nzMode="closeable"
      (nzOnClose)="removeFilter('body_class', bodyClass)">
      Body: {{ bodyClass }}
    </nz-tag>
  </div>
</nz-card>
```

### 4. Component Logic

```typescript
// frontend/src/app/pages/discover/discover.component.ts

export class DiscoverComponent implements AfterViewInit {
  // Filter selection state
  selectedManufacturers: string[] = [];
  selectedModels: string[] = [];
  selectedBodyClasses: string[] = [];

  // Search terms for filtering dropdown lists
  manufacturerSearchTerm = '';
  modelSearchTerm = '';

  // Data sources
  manufacturers$ = this.vehicleState.manufacturers$;
  models$ = this.vehicleState.models$;
  bodyClasses$ = this.vehicleState.availableFilters$.pipe(
    map(filters => filters.body_classes || [])
  );

  // Filtered lists based on search terms
  filteredManufacturers$: Observable<Manufacturer[]>;
  filteredModels$: Observable<Model[]>;

  // Applied filters (for badges)
  appliedFilters$ = this.vehicleState.filters$;

  constructor(private vehicleState: VehicleStateService) {}

  ngAfterViewInit(): void {
    // Initialize filtered lists
    this.filteredManufacturers$ = this.manufacturers$.pipe(
      map(mfrs => this.filterList(mfrs, this.manufacturerSearchTerm, 'name'))
    );

    this.filteredModels$ = this.models$.pipe(
      map(models => this.filterList(models, this.modelSearchTerm, 'name'))
    );

    // Restore selected filters from state
    this.appliedFilters$.pipe(take(1)).subscribe(filters => {
      this.selectedManufacturers = filters.manufacturers || [];
      this.selectedModels = filters.models || [];
      this.selectedBodyClasses = filters.body_classes || [];
    });
  }

  onApply(): void {
    this.vehicleState.updateFilters({
      manufacturers: this.selectedManufacturers.length > 0 ? this.selectedManufacturers : null,
      models: this.selectedModels.length > 0 ? this.selectedModels : null,
      body_classes: this.selectedBodyClasses.length > 0 ? this.selectedBodyClasses : null
    });
  }

  onClear(): void {
    this.selectedManufacturers = [];
    this.selectedModels = [];
    this.selectedBodyClasses = [];
    this.vehicleState.clearFilters();
  }

  removeFilter(type: string, value: string): void {
    switch (type) {
      case 'manufacturer':
        this.selectedManufacturers = this.selectedManufacturers.filter(m => m !== value);
        break;
      case 'model':
        this.selectedModels = this.selectedModels.filter(m => m !== value);
        break;
      case 'body_class':
        this.selectedBodyClasses = this.selectedBodyClasses.filter(b => b !== value);
        break;
    }
    this.onApply(); // Auto-apply after removing badge
  }

  getFilterCountBadge(filterType: string): string {
    let count = 0;
    switch (filterType) {
      case 'manufacturers':
        count = this.selectedManufacturers.length;
        break;
      case 'body_classes':
        count = this.selectedBodyClasses.length;
        break;
      case 'year':
        // Check if year range is set
        const filters = this.appliedFilters$.value;
        count = (filters.year_min || filters.year_max) ? 1 : 0;
        break;
    }
    return count > 0 ? ` (${count})` : '';
  }

  filterManufacturers(): void {
    this.filteredManufacturers$ = this.manufacturers$.pipe(
      map(mfrs => this.filterList(mfrs, this.manufacturerSearchTerm, 'name'))
    );
  }

  filterModels(): void {
    this.filteredModels$ = this.models$.pipe(
      map(models => this.filterList(models, this.modelSearchTerm, 'name'))
    );
  }

  private filterList<T>(items: T[], searchTerm: string, field: keyof T): T[] {
    if (!searchTerm) return items;
    const term = searchTerm.toLowerCase();
    return items.filter(item =>
      String(item[field]).toLowerCase().includes(term)
    );
  }

  private arraysEqual(a: any[] | undefined, b: any[] | undefined): boolean {
    const arr1 = a || [];
    const arr2 = b || [];
    if (arr1.length !== arr2.length) return false;
    const sorted1 = [...arr1].sort();
    const sorted2 = [...arr2].sort();
    return sorted1.every((val, idx) => val === sorted2[idx]);
  }
}
```

### 5. State Service Changes

```typescript
// frontend/src/app/features/vehicles/services/vehicle-state.service.ts

updateFilters(partialFilters: Partial<VehicleSearchFilters>): void {
  const currentFilters = this.filtersSubject.value;
  const newFilters = { ...currentFilters, ...partialFilters };

  // Clean up empty arrays
  if (newFilters.manufacturers && newFilters.manufacturers.length === 0) {
    delete newFilters.manufacturers;
  }
  if (newFilters.models && newFilters.models.length === 0) {
    delete newFilters.models;
  }
  if (newFilters.body_classes && newFilters.body_classes.length === 0) {
    delete newFilters.body_classes;
  }

  this.updateState(() => {
    this.filtersSubject.next(newFilters);
  });

  this.search();
  this.saveCurrentState();
}
```

### 6. HTTP Service Changes

```typescript
// frontend/src/app/services/vehicle.service.ts

searchVehicles(filters: VehicleSearchFilters, pagination: Pagination): Observable<VehicleSearchResponse> {
  let params = new HttpParams()
    .set('page', pagination.page.toString())
    .set('limit', pagination.limit.toString());

  // Array parameters: join with comma
  if (filters.manufacturers && filters.manufacturers.length > 0) {
    params = params.set('manufacturers', filters.manufacturers.join(','));
  }
  if (filters.models && filters.models.length > 0) {
    params = params.set('models', filters.models.join(','));
  }
  if (filters.body_classes && filters.body_classes.length > 0) {
    params = params.set('body_classes', filters.body_classes.join(','));
  }

  // Year range (unchanged)
  if (filters.year_min) {
    params = params.set('year_min', filters.year_min.toString());
  }
  if (filters.year_max) {
    params = params.set('year_max', filters.year_max.toString());
  }

  // Sorting (unchanged)
  if (filters.sort) {
    params = params.set('sort', filters.sort);
  }
  if (filters.order) {
    params = params.set('order', filters.order);
  }

  return this.http.get<any>(`${this.apiUrl}/vehicles`, { params }).pipe(
    map(this.transformVehicleResponse.bind(this))
  );
}
```

---

## Testing Strategy

### Unit Tests

```typescript
// vehicle-state.service.spec.ts

describe('VehicleStateService - Multi-Select Filters', () => {
  it('should handle multi-select manufacturer filter', () => {
    service.updateFilters({ manufacturers: ['Buick', 'Cadillac'] });

    expect(service.filters$.value.manufacturers).toEqual(['Buick', 'Cadillac']);
  });

  it('should remove empty arrays from filters', () => {
    service.updateFilters({ manufacturers: [] });

    expect(service.filters$.value.manufacturers).toBeUndefined();
  });

  it('should persist multi-select filters to localStorage', () => {
    service.updateFilters({ manufacturers: ['Buick', 'Ford'], models: ['Sedan'] });

    const saved = JSON.parse(localStorage.getItem('autos2.discover.state')!);
    expect(saved.filters.manufacturers).toEqual(['Buick', 'Ford']);
    expect(saved.filters.models).toEqual(['Sedan']);
  });
});

// vehicle.service.spec.ts

describe('VehicleService - Multi-Select API Calls', () => {
  it('should send comma-separated manufacturers to API', (done) => {
    const filters: VehicleSearchFilters = {
      manufacturers: ['Buick', 'Cadillac', 'Ford']
    };

    service.searchVehicles(filters, { page: 1, limit: 20 }).subscribe(() => {
      const req = httpMock.expectOne(request =>
        request.url.includes('/vehicles') &&
        request.params.get('manufacturers') === 'Buick,Cadillac,Ford'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
      done();
    });
  });
});
```

### Manual Testing Checklist

- [ ] Select multiple manufacturers → Apply → Results show combined set
- [ ] Select manufacturer → Select models → Results winnow correctly
- [ ] Clear All button resets all selections and results
- [ ] Remove individual badge → Results update immediately
- [ ] Apply button disabled when no changes pending
- [ ] Apply button shows count "(3)" when 3 items selected
- [ ] Search box filters dropdown lists correctly
- [ ] Accordion panels expand/collapse smoothly
- [ ] Selected filters persist across page refresh
- [ ] Selected filters sync to URL parameters
- [ ] Browser back/forward navigation works

---

## Migration Strategy

### Phase 1: Backend Changes (2 hours)
1. Update backend to accept comma-separated filter values
2. Update Elasticsearch queries to use `terms` instead of `term`
3. Add unit tests for multi-value filters
4. Deploy backend first (backward compatible)

### Phase 2: Frontend Changes (4 hours)
1. Update interfaces (VehicleSearchFilters)
2. Update VehicleStateService to handle arrays
3. Update HTTP service to join arrays with commas
4. Update component template (checkbox groups)
5. Add filter badges display
6. Add unit tests

### Phase 3: UX Polish (2 hours)
1. Add search boxes for filtering dropdown lists
2. Add loading states
3. Add empty states ("Select manufacturer first")
4. Add accordion panels
5. Polish CSS/styling

---

## Success Criteria

- [ ] Users can select multiple manufacturers/models via checkboxes
- [ ] Apply button batches filter changes (no API call until clicked)
- [ ] Apply button shows count of active selections
- [ ] Clear button resets all selections
- [ ] Active filters displayed as closeable badges
- [ ] Search boxes filter dropdown lists
- [ ] Accordion panels organize filters cleanly
- [ ] Selected filters persist to localStorage and URL
- [ ] All existing tests pass
- [ ] New tests achieve >90% coverage
- [ ] No performance regression (measured with Chrome DevTools)

---

## Open Questions

1. **OR vs AND logic**: Should multiple manufacturers be OR'd or AND'd?
   - **Decision**: OR logic (same as legacy app)
   - Selecting "Buick + Cadillac" shows vehicles from either brand

2. **Cross-filter logic**: Manufacturer + Model relationship?
   - **Decision**: Models dropdown shows only models from selected manufacturers
   - If no manufacturer selected, show all models (or empty state)

3. **URL encoding**: How to encode arrays in URL?
   - **Decision**: Comma-separated string: `?manufacturers=Buick,Cadillac`
   - Matches backend API contract

4. **Pagination reset**: Reset to page 1 on Apply?
   - **Decision**: Yes, reset to page 1 when filters change
   - Prevents confusing "page 5 of 2" scenarios

---

## References

- Legacy Autos screenshots (Discover page)
- NG-ZORRO Checkbox Group: https://ng.ant.design/components/checkbox/en
- NG-ZORRO Collapse: https://ng.ant.design/components/collapse/en
- NG-ZORRO Tag: https://ng.ant.design/components/tag/en
