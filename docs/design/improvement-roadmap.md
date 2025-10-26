# Autos2 Frontend Improvement Roadmap

## Document Purpose

This roadmap provides a prioritized, phased approach to addressing technical debt and implementing Angular best practices in the Autos2 frontend application.

---

## Overview

Based on the [Current State Analysis](./current-state-analysis.md), we have identified 37 hours of technical improvements across 8 work items. This roadmap organizes these improvements into logical phases that minimize disruption and maximize value delivery.

---

## Guiding Principles

1. **Safety First**: Address memory leaks and critical bugs before optimization
2. **Incremental Progress**: Small, testable changes over big rewrites
3. **Backward Compatibility**: Maintain existing functionality during refactoring
4. **Testing**: Add tests alongside improvements
5. **Documentation**: Update docs as patterns change

---

## Phase 1: Critical Fixes (Week 1)
**Goal**: Eliminate memory leaks and establish error handling
**Estimated Effort**: 10 hours
**Status**: ✅ COMPLETE (Session 2 - 2025-10-25)

### 1.1 Implement Subscription Cleanup

**Priority**: 🔴 CRITICAL
**Effort**: 2 hours
**TD ID**: TD-001

**Tasks**:
- [ ] Add `ngOnDestroy` to all components with subscriptions
- [ ] Implement `takeUntil` pattern with `destroy$` Subject
- [ ] Verify no lingering subscriptions with Chrome DevTools

**Implementation**:

```typescript
// Pattern to apply to all components
export class ExampleComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.service.getData()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => this.data = data);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

**Files to Update**:
- [x] `home.component.ts`
- [x] `discover.component.ts`
- [x] Any future components with subscriptions

**Acceptance Criteria**:
- [ ] All components with subscriptions implement `ngOnDestroy`
- [ ] Chrome DevTools Memory Profiler shows no subscription leaks after navigation
- [ ] ESLint rule added to enforce pattern

---

### 1.2 Create HTTP Error Interceptor

**Priority**: 🔴 CRITICAL
**Effort**: 4 hours
**TD ID**: TD-002

**Tasks**:
- [ ] Create `ErrorInterceptor` in `core/interceptors/`
- [ ] Handle 4xx and 5xx errors
- [ ] Show user-friendly notifications
- [ ] Log errors for debugging
- [ ] Register interceptor in `app.module.ts`

**Implementation**:

```typescript
// core/interceptors/error.interceptor.ts
@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(
    private notification: NzNotificationService,
    private logger: LoggerService
  ) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      retry(1),  // Retry failed requests once
      catchError((error: HttpErrorResponse) => {
        this.handleError(error);
        return throwError(() => error);
      })
    );
  }

  private handleError(error: HttpErrorResponse): void {
    let message: string;

    if (error.status === 0) {
      message = 'Cannot connect to server. Please check your internet connection.';
    } else if (error.status === 401) {
      message = 'Unauthorized. Please log in again.';
    } else if (error.status === 403) {
      message = 'You do not have permission to access this resource.';
    } else if (error.status === 404) {
      message = 'Requested resource not found.';
    } else if (error.status >= 500) {
      message = 'Server error. Please try again later.';
    } else {
      message = error.error?.message || 'An unexpected error occurred.';
    }

    this.notification.error('Error', message, { nzDuration: 5000 });
    this.logger.error('HTTP Error:', error);
  }
}
```

**Acceptance Criteria**:
- [ ] All HTTP errors show user-friendly notifications
- [ ] 4xx errors have specific messages
- [ ] 5xx errors show generic "server error" message
- [ ] Errors are logged to console in development
- [ ] Manual test: Disconnect network, verify error shown

---

### 1.3 Implement Loading Interceptor

**Priority**: 🟡 HIGH
**Effort**: 4 hours
**TD ID**: TD-002

**Tasks**:
- [ ] Create `LoadingInterceptor`
- [ ] Create `LoadingService` with BehaviorSubject
- [ ] Track active requests count
- [ ] Show/hide global loading spinner
- [ ] Add loading spinner to app component

**Implementation**:

```typescript
// core/services/loading.service.ts
@Injectable({ providedIn: 'root' })
export class LoadingService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();

  private activeRequests = 0;

  show(): void {
    this.activeRequests++;
    if (this.activeRequests === 1) {
      this.loadingSubject.next(true);
    }
  }

  hide(): void {
    this.activeRequests--;
    if (this.activeRequests === 0) {
      this.loadingSubject.next(false);
    }
  }
}

// core/interceptors/loading.interceptor.ts
@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
  constructor(private loadingService: LoadingService) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    this.loadingService.show();

    return next.handle(req).pipe(
      finalize(() => this.loadingService.hide())
    );
  }
}
```

**Acceptance Criteria**:
- [ ] Loading spinner shown during HTTP requests
- [ ] Spinner hidden when all requests complete
- [ ] Multiple simultaneous requests handled correctly
- [ ] No spinner flicker on fast requests (<200ms)

---

## Phase 2: State Management (Week 2)
**Goal**: Centralize state management and improve data flow
**Estimated Effort**: 12 hours
**Status**: ✅ COMPLETE (Sessions 3-10 - 2025-10-25)

### 2.1 Create Vehicle State Service

**Priority**: 🟡 HIGH
**Effort**: 8 hours
**TD ID**: TD-003

**Tasks**:
- [ ] Create `VehicleStateService`
- [ ] Implement BehaviorSubject pattern for:
  - Manufacturers list
  - Models list (filtered by manufacturer)
  - Search results
  - Active filters
  - Loading state
- [ ] Refactor components to use state service
- [ ] Add state persistence to localStorage

**Implementation**:

```typescript
// features/vehicles/services/vehicle-state.service.ts
@Injectable({ providedIn: 'root' })
export class VehicleStateService {
  // Private state
  private manufacturersSubject = new BehaviorSubject<Manufacturer[]>([]);
  private modelsSubject = new BehaviorSubject<Model[]>([]);
  private vehiclesSubject = new BehaviorSubject<Vehicle[]>([]);
  private filtersSubject = new BehaviorSubject<VehicleSearchFilters>({});
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private paginationSubject = new BehaviorSubject<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  // Public observables
  manufacturers$ = this.manufacturersSubject.asObservable();
  models$ = this.modelsSubject.asObservable();
  vehicles$ = this.vehiclesSubject.asObservable();
  filters$ = this.filtersSubject.asObservable();
  loading$ = this.loadingSubject.asObservable();
  pagination$ = this.paginationSubject.asObservable();

  // Combined selectors
  hasResults$ = this.vehicles$.pipe(
    map(vehicles => vehicles.length > 0)
  );

  constructor(private vehicleApi: VehicleService) {
    this.initialize();
  }

  private initialize(): void {
    // Load manufacturers on service creation
    this.loadManufacturers();

    // Restore filters from localStorage
    this.restoreState();
  }

  loadManufacturers(): void {
    this.vehicleApi.getManufacturers().subscribe(
      data => this.manufacturersSubject.next(data)
    );
  }

  selectManufacturer(name: string | null): void {
    const currentFilters = this.filtersSubject.value;
    const newFilters = {
      ...currentFilters,
      manufacturer: name,
      model: null  // Reset model when manufacturer changes
    };

    this.filtersSubject.next(newFilters);
    this.modelsSubject.next([]);  // Clear models

    if (name) {
      this.vehicleApi.getModels(name).subscribe(
        data => this.modelsSubject.next(data)
      );
    }

    this.search(newFilters);
  }

  selectModel(name: string | null): void {
    const currentFilters = this.filtersSubject.value;
    const newFilters = { ...currentFilters, model: name };

    this.filtersSubject.next(newFilters);
    this.search(newFilters);
  }

  updateFilters(filters: Partial<VehicleSearchFilters>): void {
    const currentFilters = this.filtersSubject.value;
    const newFilters = { ...currentFilters, ...filters };

    this.filtersSubject.next(newFilters);
    this.search(newFilters);
  }

  search(filters?: VehicleSearchFilters): void {
    const searchFilters = filters || this.filtersSubject.value;
    const pagination = this.paginationSubject.value;

    const params = {
      ...searchFilters,
      page: pagination.page,
      limit: pagination.limit
    };

    this.loadingSubject.next(true);

    this.vehicleApi.searchVehicles(params).pipe(
      finalize(() => this.loadingSubject.next(false))
    ).subscribe(
      response => {
        this.vehiclesSubject.next(response.data);
        this.paginationSubject.next(response.pagination);
        this.saveState();
      }
    );
  }

  changePage(page: number): void {
    const pagination = this.paginationSubject.value;
    this.paginationSubject.next({ ...pagination, page });
    this.search();
  }

  changePageSize(limit: number): void {
    const pagination = this.paginationSubject.value;
    this.paginationSubject.next({ ...pagination, limit, page: 1 });
    this.search();
  }

  clearFilters(): void {
    this.filtersSubject.next({});
    this.modelsSubject.next([]);
    this.search({});
  }

  private saveState(): void {
    const state = {
      filters: this.filtersSubject.value,
      pagination: this.paginationSubject.value
    };
    localStorage.setItem('vehicleSearchState', JSON.stringify(state));
  }

  private restoreState(): void {
    const saved = localStorage.getItem('vehicleSearchState');
    if (saved) {
      const state = JSON.parse(saved);
      this.filtersSubject.next(state.filters || {});
      this.paginationSubject.next(state.pagination || {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
      });
    }
  }
}
```

**Refactored Component**:
```typescript
// discover.component.ts (after refactoring)
@Component({
  selector: 'app-discover',
  templateUrl: './discover.component.html'
})
export class DiscoverComponent {
  // No more local state! Everything from service
  manufacturers$ = this.state.manufacturers$;
  models$ = this.state.models$;
  vehicles$ = this.state.vehicles$;
  loading$ = this.state.loading$;
  pagination$ = this.state.pagination$;
  filters$ = this.state.filters$;

  constructor(private state: VehicleStateService) { }

  onManufacturerChange(name: string): void {
    this.state.selectManufacturer(name);
  }

  onModelChange(name: string): void {
    this.state.selectModel(name);
  }

  onSearch(): void {
    this.state.search();
  }

  onPageChange(page: number): void {
    this.state.changePage(page);
  }

  onClearFilters(): void {
    this.state.clearFilters();
  }
}
```

**Acceptance Criteria**:
- [ ] All vehicle-related state managed by VehicleStateService
- [ ] Components use observables from service
- [ ] State persists across route navigation
- [ ] Search filters restored from localStorage
- [ ] No duplicate API calls for same data

---

### 2.2 Migrate Components to Async Pipe

**Priority**: 🟡 HIGH
**Effort**: 4 hours
**TD ID**: TD-004

**Tasks**:
- [ ] Replace manual subscriptions with async pipe in templates
- [ ] Remove `ngOnDestroy` where async pipe is used
- [ ] Update component properties from values to observables
- [ ] Test all data binding still works

**Before**:
```typescript
export class HomeComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  stats: Stats | null = null;

  ngOnInit(): void {
    this.vehicleService.getStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => this.stats = data);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

```html
<div *ngIf="stats">
  <h3>{{ stats.total_vehicles }}</h3>
</div>
```

**After**:
```typescript
export class HomeComponent {
  stats$ = this.vehicleService.getStats();

  constructor(private vehicleService: VehicleService) { }
}
```

```html
<div *ngIf="stats$ | async as stats">
  <h3>{{ stats.total_vehicles }}</h3>
</div>
```

**Files to Update**:
- [x] `home.component.ts` / `.html`
- [x] `discover.component.ts` / `.html`

**Acceptance Criteria**:
- [ ] All subscriptions use async pipe
- [ ] No more manual `subscribe()` calls in components
- [ ] All functionality works as before
- [ ] Memory profiler shows no leaks

---

## Phase 3: Type Safety & Error Handling (Week 3)
**Goal**: Improve TypeScript usage and consistent error handling
**Estimated Effort**: 5 hours
**Status**: ⏸️ Pending

### 3.1 Add Proper TypeScript Interfaces

**Priority**: 🟡 MEDIUM
**Effort**: 2 hours
**TD ID**: TD-005

**Tasks**:
- [ ] Create `VehicleSearchFilters` interface
- [ ] Replace `any` types with proper interfaces
- [ ] Move interfaces to `core/models/` directory
- [ ] Export interfaces via barrel files

**Implementation**:

```typescript
// core/models/vehicle.model.ts
export interface VehicleSearchFilters {
  manufacturer?: string;
  model?: string;
  year?: number;
  body_class?: string;
  page?: number;
  limit?: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Stats {
  total_vehicles: number;
  total_manufacturers: number;
  body_class_distribution: Array<{
    name: string;
    count: number;
  }>;
}

// ... other interfaces
```

```typescript
// core/models/index.ts (barrel file)
export * from './vehicle.model';
```

**Acceptance Criteria**:
- [ ] No `any` types in service methods
- [ ] All interfaces in `core/models/`
- [ ] Barrel exports working
- [ ] TypeScript compilation with no errors

---

### 3.2 Implement Error Handling Service

**Priority**: 🟡 MEDIUM
**Effort**: 3 hours
**TD ID**: TD-006

**Tasks**:
- [ ] Create `ErrorHandlerService`
- [ ] Standardize error messages
- [ ] Add retry logic for transient errors
- [ ] Add error logging to console in dev mode

**Implementation**:

```typescript
// core/services/error-handler.service.ts
@Injectable({ providedIn: 'root' })
export class ErrorHandlerService {
  constructor(
    private notification: NzNotificationService,
    private logger: LoggerService
  ) { }

  handleError(
    error: any,
    userMessage?: string,
    context?: string
  ): Observable<never> {
    const message = this.getErrorMessage(error, userMessage);

    this.logger.error(`[${context || 'Error'}]`, error);
    this.notification.error('Error', message, { nzDuration: 5000 });

    return throwError(() => error);
  }

  handleHttpError(
    operation: string,
    error: HttpErrorResponse
  ): Observable<never> {
    let message: string;

    if (error.status === 0) {
      message = `Cannot connect to server while ${operation}.`;
    } else if (error.status === 404) {
      message = `Resource not found while ${operation}.`;
    } else if (error.status >= 500) {
      message = `Server error while ${operation}. Please try again.`;
    } else {
      message = error.error?.message || `Error while ${operation}.`;
    }

    this.logger.error(`HTTP Error [${operation}]:`, error);
    this.notification.error('Error', message);

    return throwError(() => error);
  }

  private getErrorMessage(error: any, userMessage?: string): string {
    if (userMessage) return userMessage;

    if (error instanceof HttpErrorResponse) {
      return this.getHttpErrorMessage(error);
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'An unexpected error occurred.';
  }

  private getHttpErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 0) {
      return 'Cannot connect to server. Please check your connection.';
    }

    return error.error?.message || `Server error: ${error.status}`;
  }
}
```

**Usage in Services**:
```typescript
searchVehicles(filters: VehicleSearchFilters): Observable<VehicleSearchResponse> {
  return this.http.get<VehicleSearchResponse>(`${this.apiUrl}/vehicles`, { params })
    .pipe(
      catchError(error =>
        this.errorHandler.handleHttpError('searching vehicles', error)
      )
    );
}
```

**Acceptance Criteria**:
- [ ] All services use ErrorHandlerService
- [ ] Consistent error messages across app
- [ ] Errors logged to console in development
- [ ] User sees helpful error notifications

---

## Phase 4: Performance Optimization (Week 4)
**Goal**: Optimize rendering and change detection
**Estimated Effort**: 4 hours
**Status**: ⏸️ Pending

### 4.1 Add TrackBy Functions

**Priority**: 🟠 MEDIUM
**Effort**: 2 hours
**TD ID**: TD-007

**Tasks**:
- [ ] Add trackBy functions to all `*ngFor` directives
- [ ] Use unique identifiers (VIN, ID, etc.)
- [ ] Test with large data sets (1000+ items)

**Implementation**:

```typescript
// discover.component.ts
trackByVehicleVin(index: number, vehicle: Vehicle): string {
  return vehicle.vin;
}

trackByManufacturerName(index: number, mfr: Manufacturer): string {
  return mfr.name;
}
```

```html
<tr *ngFor="let vehicle of vehicles$ | async; trackBy: trackByVehicleVin">
  <td>{{ vehicle.vin }}</td>
  ...
</tr>

<nz-option
  *ngFor="let mfr of manufacturers$ | async; trackBy: trackByManufacturerName"
  [nzValue]="mfr.name"
  [nzLabel]="mfr.name">
</nz-option>
```

**Acceptance Criteria**:
- [ ] All `*ngFor` have trackBy functions
- [ ] Performance improvement measurable in Chrome DevTools
- [ ] No visual regression

---

### 4.2 Implement OnPush Change Detection

**Priority**: 🟢 LOW
**Effort**: 2 hours

**Tasks**:
- [ ] Add `changeDetection: ChangeDetectionStrategy.OnPush` to components
- [ ] Verify async pipe usage (required for OnPush)
- [ ] Test all change detection scenarios

**Implementation**:

```typescript
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent {
  stats$ = this.vehicleService.getStats();
}
```

**Requirements**:
- Must use async pipe (already done in Phase 2)
- Must use immutable data patterns
- Manual `markForCheck()` for imperative updates

**Acceptance Criteria**:
- [ ] All components use OnPush
- [ ] No change detection bugs
- [ ] Performance improvement in large lists

---

## Phase 5: Architecture Refactoring (Week 5-6)
**Goal**: Reorganize into scalable feature modules
**Estimated Effort**: 12 hours
**Status**: ⏸️ Pending

### 5.1 Create Feature Module Structure

**Priority**: 🟢 LOW
**Effort**: 12 hours
**TD ID**: TD-008

**Tasks**:
- [ ] Create `core` module for singletons
- [ ] Create `shared` module for reusable components
- [ ] Create `features/vehicles` module
- [ ] Migrate existing code to new structure
- [ ] Update imports throughout app
- [ ] Configure lazy loading for feature modules

**Target Structure**:
```
src/app/
├── core/
│   ├── core.module.ts
│   ├── interceptors/
│   │   ├── error.interceptor.ts
│   │   └── loading.interceptor.ts
│   ├── services/
│   │   ├── error-handler.service.ts
│   │   └── loading.service.ts
│   └── models/
│       └── vehicle.model.ts
│
├── shared/
│   ├── shared.module.ts
│   ├── components/
│   ├── directives/
│   └── pipes/
│
├── features/
│   ├── home/
│   │   ├── home.component.ts
│   │   ├── home.module.ts
│   │   └── home-routing.module.ts
│   │
│   └── vehicles/
│       ├── vehicles.module.ts
│       ├── vehicles-routing.module.ts
│       ├── pages/
│       │   └── discover/
│       ├── components/
│       │   ├── search-form/
│       │   └── vehicle-table/
│       └── services/
│           ├── vehicle-api.service.ts
│           └── vehicle-state.service.ts
│
├── app-routing.module.ts
├── app.component.ts
└── app.module.ts
```

**Lazy Loading Configuration**:
```typescript
// app-routing.module.ts
const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadChildren: () => import('./features/home/home.module')
      .then(m => m.HomeModule)
  },
  {
    path: 'vehicles',
    loadChildren: () => import('./features/vehicles/vehicles.module')
      .then(m => m.VehiclesModule)
  }
];
```

**Acceptance Criteria**:
- [ ] Feature modules created
- [ ] Core module configured as singleton
- [ ] Shared module exported common components
- [ ] Lazy loading working
- [ ] Bundle size reduced by 30%+
- [ ] All tests pass

---

## Phase 6: Advanced UX Features (Future)
**Goal**: Match UX sophistication of legacy Autos application and Aircraft Registry
**Estimated Effort**: 25-30 hours
**Status**: 📋 Planned
**Inspired By**: Legacy Autos application screenshots and Aircraft Registry reference

### 6.1 Multi-Select Filters with Apply Pattern

**Priority**: 🟡 HIGH (UX Parity with legacy app)
**Effort**: 8 hours

**Current Behavior**:
- Single-select dropdowns with immediate search on change
- Each filter change triggers API call
- No ability to select multiple manufacturers/models

**Desired Behavior** (from legacy Autos screenshots):
- Checkbox-based multi-select for manufacturers and models
- "Apply" button to batch-execute search
- "Clear" button to reset all selections
- Active filter count display (e.g., "2 model(s) selected")
- Expandable/collapsible filter panels

**Tasks**:
- [ ] Replace single-select dropdowns with NG-ZORRO `nz-checkbox-group`
- [ ] Add "Apply (count)" and "Clear" buttons
- [ ] Update VehicleStateService to handle array-based filters
- [ ] Debounce API calls until Apply is clicked
- [ ] Show selected filter chips/badges
- [ ] Add expandable accordion panels for filter groups

**Implementation Sketch**:
```typescript
// VehicleSearchFilters interface update
export interface VehicleSearchFilters {
  manufacturers?: string[];  // Changed from string to string[]
  models?: string[];         // Changed from string to string[]
  year_min?: number;
  year_max?: number;
  body_classes?: string[];   // New: multi-select body class
}

// Component
selectedManufacturers: string[] = [];
selectedModels: string[] = [];

onApply(): void {
  this.vehicleState.updateFilters({
    manufacturers: this.selectedManufacturers,
    models: this.selectedModels
  });
}

onClear(): void {
  this.selectedManufacturers = [];
  this.selectedModels = [];
  this.vehicleState.clearFilters();
}
```

**Acceptance Criteria**:
- [ ] Users can select multiple manufacturers/models via checkboxes
- [ ] Apply button shows count (e.g., "Apply (3)")
- [ ] Clear button resets all selections
- [ ] Filters batch-update on Apply (not per-selection)
- [ ] Selected items shown as chips/badges
- [ ] Accordion panels expand/collapse cleanly

---

### 6.2 Year Range Selector

**Priority**: 🟡 HIGH (Backend already supports it!)
**Effort**: 3 hours

**Current Behavior**:
- Single year dropdown (select 1975 only)
- Backend receives `year_min=1975&year_max=1975`

**Desired Behavior** (from legacy Autos screenshots):
- Dual-slider or From/To dropdowns
- Select range like "1960-1970" in one interaction
- Visual feedback of selected range

**Tasks**:
- [ ] Implement dual-dropdown approach (simpler, more accessible)
  - "From Year" dropdown (1900-2025)
  - "To Year" dropdown (1900-2025)
- [ ] OR: Implement NG-ZORRO `nz-slider` with range mode (more visual)
- [ ] Update component to set year_min/year_max
- [ ] Validation: Ensure From <= To
- [ ] Show selected range label (e.g., "1960-1970")

**Implementation Sketch**:
```html
<!-- Option A: Dual Dropdowns (Accessible) -->
<nz-form-item>
  <nz-form-label>Year Range</nz-form-label>
  <nz-form-control>
    <div style="display: flex; gap: 8px; align-items: center;">
      <nz-select [(ngModel)]="yearMin" [nzPlaceHolder]="'From Year'">
        <nz-option *ngFor="let year of years" [nzValue]="year" [nzLabel]="year"></nz-option>
      </nz-select>
      <span>to</span>
      <nz-select [(ngModel)]="yearMax" [nzPlaceHolder]="'To Year'">
        <nz-option *ngFor="let year of years" [nzValue]="year" [nzLabel]="year"></nz-option>
      </nz-select>
    </div>
  </nz-form-control>
</nz-form-item>

<!-- Option B: Range Slider (Visual) -->
<nz-form-item>
  <nz-form-label>Year Range: {{ yearRange[0] }} - {{ yearRange[1] }}</nz-form-label>
  <nz-form-control>
    <nz-slider
      [nzRange]="true"
      [(ngModel)]="yearRange"
      [nzMin]="1900"
      [nzMax]="2025"
      [nzStep]="1">
    </nz-slider>
  </nz-form-control>
</nz-form-item>
```

**Acceptance Criteria**:
- [ ] Users can select year range (e.g., 1960-1970)
- [ ] Validation prevents To < From
- [ ] Backend receives correct year_min/year_max parameters
- [ ] Visual feedback shows selected range
- [ ] Works with Apply button pattern (if implementing 6.1 first)

---

### 6.3 Distribution Charts (PlotlyJS Integration)

**Priority**: 🟠 MEDIUM (High visual impact)
**Effort**: 8 hours

**Current Behavior**:
- Text-based stats on home page
- No visual data exploration

**Desired Behavior** (from Aircraft Registry screenshots):
- Interactive bar charts showing data distributions
- "Vehicles by Manufacturer" chart (top 10 manufacturers)
- "Body Class Distribution" chart
- Hover tooltips showing exact counts
- Click-to-filter interaction (optional)

**Tasks**:
- [ ] Install and configure angular-plotly.js
- [ ] Create `DistributionChartComponent` (reusable)
- [ ] Fetch aggregation data from stats endpoint
- [ ] Implement "Vehicles by Manufacturer" chart
- [ ] Implement "Body Class Distribution" chart
- [ ] Add to Home page or create new Analytics page
- [ ] Make charts responsive
- [ ] (Optional) Click chart bar to filter Discover page

**Implementation Sketch**:
```typescript
// distribution-chart.component.ts
@Component({
  selector: 'app-distribution-chart',
  template: `
    <plotly-plot
      [data]="chartData"
      [layout]="chartLayout"
      [config]="chartConfig">
    </plotly-plot>
  `
})
export class DistributionChartComponent implements OnInit {
  @Input() title: string;
  @Input() data: Array<{name: string, count: number}>;

  chartData: any[];
  chartLayout: any;
  chartConfig: any = { responsive: true };

  ngOnInit(): void {
    this.chartData = [{
      x: this.data.map(d => d.name),
      y: this.data.map(d => d.count),
      type: 'bar',
      marker: { color: '#1890ff' }
    }];

    this.chartLayout = {
      title: this.title,
      xaxis: { title: 'Category' },
      yaxis: { title: 'Count' },
      margin: { t: 40, r: 20, b: 100, l: 60 }
    };
  }
}

// home.component.html
<nz-row [nzGutter]="16">
  <nz-col [nzSpan]="12">
    <nz-card nzTitle="Vehicles by Manufacturer">
      <app-distribution-chart
        *ngIf="stats$ | async as stats"
        [title]="'Top 10 Manufacturers'"
        [data]="stats.manufacturer_distribution | slice:0:10">
      </app-distribution-chart>
    </nz-card>
  </nz-col>
  <nz-col [nzSpan]="12">
    <nz-card nzTitle="Body Class Distribution">
      <app-distribution-chart
        *ngIf="stats$ | async as stats"
        [title]="'Vehicle Types'"
        [data]="stats.body_class_distribution">
      </app-distribution-chart>
    </nz-card>
  </nz-col>
</nz-row>
```

**Acceptance Criteria**:
- [ ] PlotlyJS charts render correctly
- [ ] Charts show manufacturer and body class distributions
- [ ] Hover tooltips display exact counts
- [ ] Charts are responsive (resize with window)
- [ ] Charts match NG-ZORRO color scheme
- [ ] Loading states handled gracefully

---

### 6.4 Expandable/Collapsible Filter Panels

**Priority**: 🟢 MEDIUM (Clean UI, progressive disclosure)
**Effort**: 4 hours

**Current Behavior**:
- Flat filter layout
- All filters always visible

**Desired Behavior** (from Aircraft Registry screenshots):
- Accordion-style expandable sections
- "Expand All" / "Collapse All" buttons
- Hierarchical manufacturer → models display
- Panel headers show active filter count

**Tasks**:
- [ ] Refactor filters to use NG-ZORRO `nz-collapse` (accordion)
- [ ] Create filter panel groups:
  - "Manufacturer + Model" panel
  - "Year Range" panel
  - "Body Class" panel
- [ ] Add "Expand All" / "Collapse All" buttons
- [ ] Show active filter count in panel headers
- [ ] Persist panel expansion state to localStorage

**Implementation Sketch**:
```html
<nz-collapse>
  <nz-collapse-panel
    [nzHeader]="'Manufacturer + Model' + (manufacturerFilterCount ? ' (' + manufacturerFilterCount + ')' : '')"
    [nzActive]="true">
    <!-- Manufacturer checkbox list -->
    <!-- Model checkbox list (filtered by selected manufacturers) -->
  </nz-collapse-panel>

  <nz-collapse-panel
    [nzHeader]="'Year Range' + (yearFilterActive ? ' (active)' : '')"
    [nzActive]="false">
    <!-- Year range selector -->
  </nz-collapse-panel>

  <nz-collapse-panel
    [nzHeader]="'Body Class' + (bodyClassFilterCount ? ' (' + bodyClassFilterCount + ')' : '')"
    [nzActive]="false">
    <!-- Body class checkbox list -->
  </nz-collapse-panel>
</nz-collapse>

<div style="margin-top: 16px;">
  <button nz-button (click)="expandAll()">Expand All</button>
  <button nz-button (click)="collapseAll()">Collapse All</button>
</div>
```

**Acceptance Criteria**:
- [ ] Filters organized into logical accordion panels
- [ ] Panel headers show active filter counts
- [ ] Expand/Collapse All buttons work
- [ ] Panel state persists to localStorage
- [ ] Clean, uncluttered UI

---

### 6.5 Customizable Dashboard Layout

**Priority**: 🟢 LOW (Power user feature, future)
**Effort**: 15+ hours

**Current Behavior**:
- Fixed page layouts
- No customization options

**Desired Behavior** (from Workshop screenshots):
- Drag-and-drop resizable panels
- User-defined layouts
- Save/load custom layouts (PostgreSQL user preferences)
- Admin vs. user default layouts

**Tasks**:
- [ ] Install and configure angular-gridster2
- [ ] Create dashboard framework component
- [ ] Define panel types (filters, results, charts, etc.)
- [ ] Implement drag-and-drop
- [ ] Implement resize handles
- [ ] Save layouts to user preferences API
- [ ] Load saved layouts on login
- [ ] Provide "Reset to Default" option

**Acceptance Criteria**:
- [ ] Users can drag panels to rearrange
- [ ] Users can resize panels
- [ ] Layouts persist across sessions
- [ ] Admin can define default layouts
- [ ] Performance remains acceptable with 6+ panels

---

## Phase 7: Component Decomposition (Future)
**Goal**: Split large components into smaller, reusable pieces
**Status**: 📋 Planned (Deferred after Phase 6)

### 7.1 Extract Presentational Components

**Tasks**:
- [ ] Create `SearchFormComponent` (presentational)
- [ ] Create `VehicleTableComponent` (presentational)
- [ ] Create `FiltersComponent` (presentational)
- [ ] Refactor `DiscoverComponent` to container pattern

---

## Success Metrics

### Performance Metrics
- [ ] Initial bundle size < 2MB
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s
- [ ] Lighthouse Performance Score > 90

### Code Quality Metrics
- [ ] Test coverage > 80%
- [ ] No ESLint errors
- [ ] No memory leaks (verified with profiler)
- [ ] TypeScript strict mode enabled

### Developer Experience Metrics
- [ ] Build time < 30s
- [ ] Hot reload < 3s
- [ ] Clear documentation for all patterns
- [ ] New developer onboarding < 1 day

---

## Decision Log

| Date | Decision | Rationale | Status |
|------|----------|-----------|--------|
| 2025-10-24 | Use BehaviorSubject for state | Simple, sufficient for app size | ✅ Approved |
| 2025-10-24 | No NgRx | Overkill for current requirements | ✅ Approved |
| 2025-10-24 | Use async pipe everywhere | Prevents memory leaks, cleaner code | ✅ Approved |
| 2025-10-24 | Defer lazy loading to Phase 5 | Small initial bundle, not critical | ✅ Approved |
| 2025-10-24 | OnPush after async pipe migration | Requires async pipe to work well | ✅ Approved |

---

## Risk Register

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Breaking changes during refactoring | High | Medium | Comprehensive testing, feature flags |
| Time overrun on Phase 5 | Medium | High | Can be split across multiple sprints |
| Team learning curve on new patterns | Medium | Medium | Pair programming, code reviews |
| Regression bugs | High | Low | Automated tests, manual QA |

---

## Appendix: Quick Reference

### Phase Checklist

- [x] **Phase 1**: Critical Fixes (Week 1) ✅ COMPLETE
  - [x] Subscription cleanup
  - [x] Error interceptor
  - [x] Loading interceptor

- [x] **Phase 2**: State Management (Week 2) ✅ COMPLETE
  - [x] Vehicle state service
  - [x] Async pipe migration
  - [x] URL synchronization with browser history
  - [x] localStorage persistence (7-day expiration)
  - [x] Column sorting (Year, Manufacturer, Model, Body Class)
  - [x] Year filter (1900-2025 range)

- [ ] **Phase 3**: Type Safety (Week 3)
  - [ ] TypeScript interfaces
  - [ ] Error handling service

- [ ] **Phase 4**: Performance (Week 4)
  - [ ] TrackBy functions
  - [ ] OnPush change detection

- [ ] **Phase 5**: Architecture (Week 5-6)
  - [ ] Feature modules
  - [ ] Lazy loading

- [ ] **Phase 6**: Advanced UX Features (Future)
  - [ ] Multi-select filters with Apply pattern
  - [ ] Year range selector
  - [ ] Distribution charts (PlotlyJS)
  - [ ] Expandable/collapsible filter panels
  - [ ] Customizable dashboard layout

---

## Next Steps

1. ✅ Review this roadmap with team
2. ✅ Create JIRA tickets for Phase 1 tasks
3. ✅ Schedule kick-off meeting
4. ✅ Begin Phase 1 implementation
5. ✅ Weekly progress reviews

---

**Document Version**: 3.0
**Last Updated**: 2025-10-26 (Session 12 - Phase 6 Added, Production v1.0.3 Deployed)
**Owner**: Autos2 Development Team
