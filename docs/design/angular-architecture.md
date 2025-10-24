# Autos2 Angular Architecture

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Core Architectural Patterns](#core-architectural-patterns)
4. [Service Layer](#service-layer)
5. [State Management](#state-management)
6. [Component Architecture](#component-architecture)
7. [Data Flow](#data-flow)
8. [HTTP Communication](#http-communication)
9. [Performance Optimization](#performance-optimization)
10. [Naming Conventions](#naming-conventions)

---

## Architecture Overview

Autos2 follows Angular's recommended architectural patterns, emphasizing:
- **Separation of Concerns**: Clear boundaries between presentation, business logic, and data access
- **Unidirectional Data Flow**: Data flows down through component trees, events bubble up
- **Reactive Programming**: RxJS Observables for async operations and data streams
- **Dependency Injection**: Services are injectable and testable
- **Component-Based UI**: Self-contained, reusable UI components

### Architectural Layers

```
┌─────────────────────────────────────────────────────┐
│              Presentation Layer                      │
│  (Components, Templates, Directives, Pipes)         │
├─────────────────────────────────────────────────────┤
│              Business Logic Layer                    │
│  (Services, State Management, Domain Logic)         │
├─────────────────────────────────────────────────────┤
│              Data Access Layer                       │
│  (HTTP Services, Interceptors, API Clients)         │
├─────────────────────────────────────────────────────┤
│              External Services                       │
│  (Backend REST API, Third-party APIs)               │
└─────────────────────────────────────────────────────┘
```

---

## Project Structure

Following Angular Style Guide recommendations:

```
frontend/src/app/
├── core/                          # Singleton services, guards, interceptors
│   ├── interceptors/             # HTTP interceptors
│   │   ├── auth.interceptor.ts
│   │   ├── error.interceptor.ts
│   │   └── loading.interceptor.ts
│   ├── guards/                   # Route guards
│   └── models/                   # Domain models and interfaces
│       └── vehicle.model.ts
│
├── shared/                        # Shared components, directives, pipes
│   ├── components/               # Reusable UI components
│   ├── directives/
│   ├── pipes/
│   └── shared.module.ts
│
├── features/                      # Feature modules (lazy-loaded)
│   ├── vehicles/
│   │   ├── components/
│   │   ├── services/
│   │   │   └── vehicle.service.ts
│   │   ├── state/               # Feature-specific state
│   │   └── vehicles.module.ts
│   └── [feature-name]/
│
├── pages/                         # Page-level components (current structure)
│   ├── home/
│   └── discover/
│
├── services/                      # Application-wide services
│   └── vehicle.service.ts        # Current: API client service
│
├── app-routing.module.ts         # Root routing
├── app.component.ts              # Root component
└── app.module.ts                 # Root module
```

**Note**: Current implementation uses `pages/` and root-level `services/`. Future refactoring should migrate to feature modules under `features/` with co-located services.

---

## Core Architectural Patterns

### 1. Single Responsibility Principle (SRP)

Every class, component, and service should have **one reason to change**.

**Example - Good (Single Responsibility):**
```typescript
// vehicle.service.ts - Only handles vehicle data operations
@Injectable({ providedIn: 'root' })
export class VehicleService {
  getVehicles(): Observable<Vehicle[]> { }
  getVehicleById(id: string): Observable<Vehicle> { }
}

// vehicle-cache.service.ts - Only handles caching
@Injectable({ providedIn: 'root' })
export class VehicleCacheService {
  cache(key: string, data: any): void { }
  get(key: string): any { }
}
```

**Example - Bad (Multiple Responsibilities):**
```typescript
// DON'T: Mixing concerns in one service
@Injectable({ providedIn: 'root' })
export class VehicleService {
  getVehicles() { }              // Data fetching
  cacheData() { }                // Caching logic
  showNotification() { }         // UI notifications
  validateInput() { }            // Validation logic
}
```

**Current State**: VehicleService ([src/app/services/vehicle.service.ts:55](frontend/src/app/services/vehicle.service.ts#L55)) correctly follows SRP - it only handles API communication for vehicle data.

---

### 2. Dependency Injection Pattern

Angular's DI system provides dependencies rather than having classes create them.

**Benefits:**
- Testability: Easy to inject mocks
- Flexibility: Can swap implementations
- Maintainability: Clear dependencies

**Example:**
```typescript
@Component({
  selector: 'app-discover',
  templateUrl: './discover.component.html'
})
export class DiscoverComponent {
  // ✓ Angular injects VehicleService automatically
  constructor(private vehicleService: VehicleService) { }
}
```

**Current State**: Properly implemented throughout the application.

---

### 3. Smart vs Presentational Components

**Smart Components** (Container Components):
- Manage state and business logic
- Connect to services
- Pass data to presentational components via `@Input()`
- Handle events from presentational components via `@Output()`

**Presentational Components** (Dumb Components):
- Receive data via `@Input()`
- Emit events via `@Output()`
- No direct service dependencies
- Highly reusable

**Example:**
```typescript
// Smart Component
@Component({
  selector: 'app-discover',
  template: `<app-vehicle-list [vehicles]="vehicles$ | async"
                               (vehicleSelected)="onSelect($event)">
             </app-vehicle-list>`
})
export class DiscoverComponent {
  vehicles$ = this.vehicleService.searchVehicles();
  constructor(private vehicleService: VehicleService) { }
}

// Presentational Component
@Component({
  selector: 'app-vehicle-list',
  template: `...`
})
export class VehicleListComponent {
  @Input() vehicles: Vehicle[] = [];
  @Output() vehicleSelected = new EventEmitter<Vehicle>();
}
```

**Current State**: Components are currently "smart" - they directly inject and use VehicleService. **Improvement needed**: Extract presentational components for better reusability and testability.

---

## Service Layer

### Service Categories

#### 1. API Client Services

**Purpose**: Interface with backend REST APIs

**Responsibilities**:
- Construct HTTP requests
- Transform API responses to domain models
- Return Observables
- NO business logic or state management

**Implementation Pattern**:
```typescript
@Injectable({ providedIn: 'root' })
export class VehicleApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // All methods return Observables
  getManufacturers(): Observable<Manufacturer[]> {
    return this.http.get<Manufacturer[]>(`${this.baseUrl}/manufacturers`)
      .pipe(
        map(response => this.transformResponse(response)),
        catchError(this.handleError)
      );
  }

  private transformResponse(data: any): Manufacturer[] {
    // Transform API response to domain model
    return data;
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    // Let interceptor handle errors
    return throwError(() => error);
  }
}
```

**Current Implementation**: [vehicle.service.ts:55](frontend/src/app/services/vehicle.service.ts#L55) correctly implements this pattern with clean API methods returning Observables.

---

#### 2. State Management Services

**Purpose**: Manage application or feature state

**Responsibilities**:
- Store current state
- Expose state as Observables
- Provide methods to update state
- Coordinate with API services

**Implementation Pattern**:
```typescript
@Injectable({ providedIn: 'root' })
export class VehicleStateService {
  // BehaviorSubject holds current value
  private manufacturersSubject = new BehaviorSubject<Manufacturer[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  // Expose as Observable (read-only)
  manufacturers$ = this.manufacturersSubject.asObservable();
  loading$ = this.loadingSubject.asObservable();

  constructor(private vehicleApi: VehicleApiService) { }

  loadManufacturers(): void {
    this.loadingSubject.next(true);
    this.vehicleApi.getManufacturers().pipe(
      finalize(() => this.loadingSubject.next(false))
    ).subscribe(
      data => this.manufacturersSubject.next(data)
    );
  }

  selectManufacturer(name: string): void {
    // Update state logic
  }
}
```

**Current State**: **NOT IMPLEMENTED**. Components subscribe directly to service methods. **Critical improvement needed** for better state management.

---

#### 3. Facade Services

**Purpose**: Simplify complex operations involving multiple services

**Example**:
```typescript
@Injectable({ providedIn: 'root' })
export class VehicleSearchFacade {
  constructor(
    private vehicleApi: VehicleApiService,
    private vehicleState: VehicleStateService,
    private filterState: FilterStateService
  ) { }

  searchWithCurrentFilters(): void {
    const filters = this.filterState.getCurrentFilters();
    this.vehicleState.setLoading(true);
    this.vehicleApi.searchVehicles(filters).subscribe(
      results => this.vehicleState.setResults(results)
    );
  }
}
```

**Current State**: Not implemented. Could simplify complex interactions in DiscoverComponent.

---

## State Management

### State Management Tiers

#### Tier 1: Local Component State
**Use When**: Data only relevant to one component

```typescript
@Component({ /* ... */ })
export class DropdownComponent {
  isOpen = false;  // Simple component-level state

  toggle(): void {
    this.isOpen = !this.isOpen;
  }
}
```

#### Tier 2: Service-Based State (BehaviorSubject Pattern)
**Use When**: Sharing state across multiple components in a feature

**Pattern**:
```typescript
@Injectable({ providedIn: 'root' })
export class SearchStateService {
  private filtersSubject = new BehaviorSubject<SearchFilters>({});

  // Read-only Observable for consumers
  filters$ = this.filtersSubject.asObservable();

  // Public method to update state
  updateFilters(filters: SearchFilters): void {
    this.filtersSubject.next(filters);
  }

  // Get current snapshot (use sparingly)
  getCurrentFilters(): SearchFilters {
    return this.filtersSubject.value;
  }
}
```

**Current State**: **NOT IMPLEMENTED**. Components manage state locally with class properties and manual subscriptions.

#### Tier 3: Global State Management (NgRx/Akita/NgXs)
**Use When**: Complex applications with:
- Shared state across many unrelated features
- Time-travel debugging requirements
- Complex state transitions

**Pattern** (NgRx):
```typescript
// State
export interface VehicleState {
  vehicles: Vehicle[];
  loading: boolean;
  error: string | null;
}

// Actions
export const loadVehicles = createAction('[Vehicle] Load');
export const loadVehiclesSuccess = createAction(
  '[Vehicle] Load Success',
  props<{ vehicles: Vehicle[] }>()
);

// Reducer
export const vehicleReducer = createReducer(
  initialState,
  on(loadVehicles, state => ({ ...state, loading: true })),
  on(loadVehiclesSuccess, (state, { vehicles }) => ({
    ...state,
    vehicles,
    loading: false
  }))
);

// Selector
export const selectAllVehicles = createSelector(
  selectVehicleState,
  state => state.vehicles
);
```

**Current State**: Not needed for Autos2's current scope. Service-based state (Tier 2) is sufficient.

**Decision**: Use Tier 2 (BehaviorSubject pattern) for this application.

---

## Component Architecture

### Component Lifecycle

Key lifecycle hooks used in Autos2:

```typescript
export class VehicleComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  constructor(private vehicleService: VehicleService) { }

  ngOnInit(): void {
    // Initialize component: load data, setup subscriptions
    this.loadData();
  }

  ngOnDestroy(): void {
    // Cleanup: unsubscribe from Observables
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadData(): void {
    this.vehicleService.getVehicles()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => this.vehicles = data);
  }
}
```

**Current State**: Using `ngOnInit` but **missing proper cleanup** in `ngOnDestroy`. **Memory leak risk**.

---

### Change Detection Strategies

#### Default Change Detection
```typescript
@Component({
  selector: 'app-vehicle',
  changeDetection: ChangeDetectionStrategy.Default  // Default
})
```
- Checks component on every change detection cycle
- Safe but can be slow for large apps

#### OnPush Change Detection
```typescript
@Component({
  selector: 'app-vehicle',
  changeDetection: ChangeDetectionStrategy.OnPush  // Optimized
})
export class VehicleComponent {
  @Input() vehicle: Vehicle;  // Only updates when input reference changes

  vehicles$ = this.vehicleService.getVehicles();  // Works with async pipe
}
```

**Benefits**:
- Significant performance improvement
- Only checks when:
  - Input reference changes
  - Event occurs in component
  - Observable emits (with async pipe)
  - Manual `markForCheck()`

**Current State**: Using Default strategy. **Improvement recommended**: Migrate to OnPush with async pipe.

---

## Data Flow

### Observable Streams with RxJS

**Core Principle**: Data flows as Observable streams, components subscribe to them.

**Naming Convention**: Observables use `$` suffix
```typescript
manufacturers$: Observable<Manufacturer[]>;
loading$: Observable<boolean>;
```

### Best Practices

#### 1. Use Async Pipe in Templates
```typescript
// Component
export class HomeComponent {
  stats$ = this.vehicleService.getStats();

  constructor(private vehicleService: VehicleService) { }
}
```

```html
<!-- Template -->
<div *ngIf="stats$ | async as stats">
  <h3>{{ stats.total_vehicles | number }}</h3>
</div>
```

**Benefits**:
- Automatic subscription management
- Automatic unsubscription on component destroy
- Works with OnPush change detection
- No memory leaks

**Current State**: **NOT USING ASYNC PIPE**. Manual subscriptions in components. **Critical improvement needed**.

---

#### 2. Unsubscribe Pattern

When manual subscriptions are necessary:

**Pattern 1: takeUntil with Subject**
```typescript
export class MyComponent implements OnInit, OnDestroy {
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

**Pattern 2: Subscription Array**
```typescript
export class MyComponent implements OnInit, OnDestroy {
  private subscriptions = new Subscription();

  ngOnInit(): void {
    this.subscriptions.add(
      this.service.getData().subscribe(data => this.data = data)
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
```

**Current State**: Components subscribe but **DO NOT unsubscribe**. **Memory leak risk in long-running sessions**.

---

## HTTP Communication

### HTTP Interceptors

Centralized handling of cross-cutting concerns:

#### 1. Authentication Interceptor
```typescript
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getToken();

    if (token) {
      req = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      });
    }

    return next.handle(req);
  }
}
```

#### 2. Error Interceptor
```typescript
@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // Handle unauthorized
          this.authService.logout();
          this.router.navigate(['/login']);
        } else if (error.status === 500) {
          // Handle server error
          this.notificationService.showError('Server error. Please try again.');
        }

        return throwError(() => error);
      })
    );
  }
}
```

#### 3. Loading Interceptor
```typescript
@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
  private activeRequests = 0;

  constructor(private loadingService: LoadingService) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (this.activeRequests === 0) {
      this.loadingService.show();
    }
    this.activeRequests++;

    return next.handle(req).pipe(
      finalize(() => {
        this.activeRequests--;
        if (this.activeRequests === 0) {
          this.loadingService.hide();
        }
      })
    );
  }
}
```

**Current State**: **NO INTERCEPTORS IMPLEMENTED**. All cross-cutting concerns handled manually in components. **High priority improvement**.

---

## Performance Optimization

### 1. Lazy Loading Modules

```typescript
// app-routing.module.ts
const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  {
    path: 'vehicles',
    loadChildren: () => import('./features/vehicles/vehicles.module')
      .then(m => m.VehiclesModule)
  }
];
```

**Current State**: All modules eagerly loaded. **Improvement recommended** as app grows.

---

### 2. TrackBy Functions

For `*ngFor` with large lists:

```typescript
@Component({ /* ... */ })
export class VehicleListComponent {
  vehicles: Vehicle[];

  trackByVin(index: number, vehicle: Vehicle): string {
    return vehicle.vin;  // Unique identifier
  }
}
```

```html
<tr *ngFor="let vehicle of vehicles; trackBy: trackByVin">
  <td>{{ vehicle.vin }}</td>
</tr>
```

**Current State**: Not implemented. **Performance improvement for large vehicle lists**.

---

### 3. Virtual Scrolling

For very large lists (1000+ items):

```typescript
import { ScrollingModule } from '@angular/cdk/scrolling';

@NgModule({
  imports: [ScrollingModule]
})
```

```html
<cdk-virtual-scroll-viewport itemSize="50" style="height: 600px">
  <div *cdkVirtualFor="let vehicle of vehicles">
    {{ vehicle.make }} {{ vehicle.model }}
  </div>
</cdk-virtual-scroll-viewport>
```

**Current State**: Not needed yet, but consider for future if result sets exceed 1000 items.

---

## Naming Conventions

Following [Angular Style Guide](https://angular.io/guide/styleguide):

### Files
| Type | Pattern | Example |
|------|---------|---------|
| Component | `feature-name.component.ts` | `vehicle-list.component.ts` |
| Service | `feature-name.service.ts` | `vehicle.service.ts` |
| Module | `feature-name.module.ts` | `vehicles.module.ts` |
| Directive | `feature-name.directive.ts` | `highlight.directive.ts` |
| Pipe | `feature-name.pipe.ts` | `currency-format.pipe.ts` |
| Model/Interface | `feature-name.model.ts` | `vehicle.model.ts` |

### Classes
```typescript
// Components: [Feature]Component
export class VehicleListComponent { }

// Services: [Feature]Service
export class VehicleService { }
export class VehicleStateService { }

// Modules: [Feature]Module
export class VehiclesModule { }
```

### Observables
```typescript
// Use $ suffix for Observable variables
manufacturers$: Observable<Manufacturer[]>;
loading$: Observable<boolean>;

// Method names describe the action
getVehicles(): Observable<Vehicle[]> { }
searchVehicles(filters: SearchFilters): Observable<SearchResult> { }
```

### Component Selectors
```typescript
// Use app- prefix, kebab-case
@Component({
  selector: 'app-vehicle-list'
})
```

**Current State**: Generally following conventions. Minor improvements needed in some areas.

---

## Summary

This architecture document defines the Angular architectural patterns and best practices for the Autos2 project. The following supporting documents provide additional context:

- [Current State Analysis](./current-state-analysis.md) - Gap analysis of current implementation
- [Improvement Roadmap](./improvement-roadmap.md) - Prioritized improvements
- [API Integration Guide](./api-integration.md) - Backend API documentation

---

**Document Version**: 1.0
**Last Updated**: 2025-10-24
**Author**: Autos2 Development Team
