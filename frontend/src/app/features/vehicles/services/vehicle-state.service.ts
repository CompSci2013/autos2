import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, merge, combineLatest, EMPTY, of } from 'rxjs';
import {
  map,
  switchMap,
  startWith,
  shareReplay,
  catchError,
  distinctUntilChanged,
  tap,
  debounceTime,
  scan,
  take
} from 'rxjs/operators';
import {
  VehicleService,
  Manufacturer,
  Model,
  Vehicle,
  Filters
} from '../../../services/vehicle.service';
import { VehicleSearchFilters, Pagination } from '../models/vehicle.model';

interface VehicleState {
  filters: VehicleSearchFilters;
  pagination: Pagination;
}

interface SearchResult {
  vehicles: Vehicle[];
  pagination: Pagination;
}

interface SortState {
  sortBy: string | null;
  sortOrder: 'asc' | 'desc' | null;
}

interface StoredState {
  version: string;
  filters: VehicleSearchFilters;
  pagination: {
    page: number;
    limit: number;
  };
  sort?: SortState;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class VehicleStateService {
  // ============================================================================
  // LOCALSTORAGE CONFIGURATION - Professional pattern for state persistence
  // ============================================================================

  private readonly STORAGE_KEY = 'autos2.discover.state';
  private readonly STORAGE_VERSION = '1.0';
  private readonly MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

  // ============================================================================
  // ACTIONS (Inputs) - Components dispatch these to trigger state changes
  // ============================================================================

  private readonly initializeAction$ = new Subject<VehicleSearchFilters>();
  private readonly selectManufacturerAction$ = new Subject<string | null>();
  private readonly selectModelAction$ = new Subject<string | null>();
  private readonly updateFiltersAction$ = new Subject<Partial<VehicleSearchFilters>>();
  private readonly changePageAction$ = new Subject<number>();
  private readonly changePageSizeAction$ = new Subject<number>();
  private readonly clearFiltersAction$ = new Subject<void>();
  private readonly sortByColumnAction$ = new Subject<SortState>();
  private readonly clearSortAction$ = new Subject<void>();

  // ============================================================================
  // STATE STREAMS (Outputs) - Components subscribe to these
  // ============================================================================

  // Core state: filters and pagination
  readonly filters$: Observable<VehicleSearchFilters>;
  readonly pagination$: Observable<Pagination>;
  readonly sortState$: Observable<SortState>;

  // Derived state: loaded from API based on filters
  readonly manufacturers$: Observable<Manufacturer[]>;
  readonly models$: Observable<Model[]>;
  readonly vehicles$: Observable<Vehicle[]>;
  readonly availableFilters$: Observable<Filters | null>;
  readonly loading$: Observable<boolean>;

  // Computed state
  readonly hasResults$: Observable<boolean>;

  // Cache current values for synchronous access
  private currentFilters: VehicleSearchFilters = {};
  private currentPagination: Pagination = { page: 1, limit: 20, total: 0, totalPages: 0 };
  private currentSort: SortState = { sortBy: null, sortOrder: null };

  constructor(private vehicleApi: VehicleService) {
    // ============================================================================
    // FILTERS STATE - Merge all filter-changing actions
    // ============================================================================

    this.filters$ = merge(
      // Initialize with params from URL
      this.initializeAction$,

      // Select manufacturer - resets model
      this.selectManufacturerAction$.pipe(
        map(manufacturer => ({ manufacturer, model: null }))
      ),

      // Select model
      this.selectModelAction$.pipe(
        map(model => ({ model }))
      ),

      // Update filters (partial update)
      this.updateFiltersAction$,

      // Clear filters - emit special marker
      this.clearFiltersAction$.pipe(
        map(() => ({ _clear: true } as any))
      )
    ).pipe(
      // Start with empty filters (browse-first pattern)
      // Use explicit nulls to match type definition
      startWith({
        manufacturer: null,
        model: null,
        body_class: null,
        year: null
      }),
      // Accumulate filter changes
      scan((currentFilters, update: any) => {
        // Check if this is a clear action
        if (update._clear) {
          return {
            manufacturer: null,
            model: null,
            body_class: null,
            year: null
          };
        }

        // If manufacturer changes (and model not provided), clear model
        // This handles user selecting new manufacturer, but preserves model during initialization
        if ('manufacturer' in update &&
            update.manufacturer !== currentFilters.manufacturer &&
            !('model' in update)) {
          return { ...currentFilters, ...update, model: null };
        }
        return { ...currentFilters, ...update };
      }, {} as VehicleSearchFilters),
      // Only emit when filters actually change
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
      // Share to avoid multiple executions (refCount false keeps it hot for auto-save)
      shareReplay({ bufferSize: 1, refCount: false })
    );

    // ============================================================================
    // PAGINATION STATE - Merge all pagination actions
    // ============================================================================

    // Explicit triggers for pagination reset (USER actions only, not initialization)
    const resetPaginationTriggers$ = merge(
      this.selectManufacturerAction$,
      this.selectModelAction$,
      this.updateFiltersAction$,
      this.clearFiltersAction$
    );

    const paginationChanges$ = merge(
      // Change page
      this.changePageAction$.pipe(
        map(page => ({ page }))
      ),

      // Change page size - reset to page 1
      this.changePageSizeAction$.pipe(
        map(limit => ({ limit, page: 1 }))
      ),

      // Reset to page 1 when USER changes filters (not during initialization)
      resetPaginationTriggers$.pipe(
        map(() => ({ page: 1 }))
      )
    );

    // Pagination state with defaults
    const initialPagination: Pagination = {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0
    };

    // Client-side pagination state (from user actions)
    const clientPagination$ = paginationChanges$.pipe(
      startWith(initialPagination),
      scan((current, change) => ({ ...current, ...change }), initialPagination),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    // ============================================================================
    // SORT STATE - Column sorting
    // ============================================================================

    this.sortState$ = merge(
      // Sort by column
      this.sortByColumnAction$,

      // Clear sort
      this.clearSortAction$.pipe(
        map(() => ({ sortBy: null, sortOrder: null }) as SortState)
      )
    ).pipe(
      // Start with no sort (default)
      startWith({ sortBy: null, sortOrder: null }),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
      shareReplay({ bufferSize: 1, refCount: false })
    );

    // ============================================================================
    // LOADING STATE - Track when search is in progress
    // ============================================================================

    const loadingStart$ = new Subject<boolean>();
    const loadingEnd$ = new Subject<boolean>();

    this.loading$ = merge(
      loadingStart$,
      loadingEnd$
    ).pipe(
      startWith(false),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    // ============================================================================
    // SEARCH EFFECT - Auto-trigger search when filters/pagination/sort change
    // ============================================================================

    const searchTrigger$ = combineLatest([
      this.filters$,
      clientPagination$,  // Use client pagination for triggering searches
      this.sortState$     // Include sort state in search trigger
    ]).pipe(
      debounceTime(100), // Small debounce to batch rapid changes
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
    );

    const searchResult$ = searchTrigger$.pipe(
      tap(() => loadingStart$.next(true)),
      switchMap(([filters, pagination, sort]) => {
        const params: any = {
          ...filters,
          page: pagination.page,
          limit: pagination.limit
        };

        // Transform year to year_min/year_max for backend API
        // Backend expects range parameters, we store single year in state
        if (filters.year) {
          params.year_min = filters.year;
          params.year_max = filters.year;
          delete params.year; // Remove year from params
        }

        // Add sort parameters if set
        if (sort.sortBy && sort.sortOrder) {
          params.sort = sort.sortBy;
          params.order = sort.sortOrder;
        }

        return this.vehicleApi.searchVehicles(params).pipe(
          map(response => ({
            vehicles: response.data,
            pagination: response.pagination
          })),
          catchError(error => {
            console.error('Error searching vehicles:', error);
            return of({
              vehicles: [],
              pagination: initialPagination
            });
          }),
          tap(() => loadingEnd$.next(false))
        );
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    // Extract vehicles from search results
    this.vehicles$ = searchResult$.pipe(
      map(result => result.vehicles),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    // Extract server pagination from search results (has total, totalPages)
    // IMPORTANT: Only extract total/totalPages, NOT page/limit (those come from client)
    const serverPagination$ = searchResult$.pipe(
      map(result => ({
        total: result.pagination.total,
        totalPages: result.pagination.totalPages
      }))
    );

    // Merge client pagination (page, limit) with server pagination (total, totalPages)
    this.pagination$ = merge(
      clientPagination$,
      serverPagination$
    ).pipe(
      scan((current, update) => ({ ...current, ...update }), initialPagination),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
      shareReplay({ bufferSize: 1, refCount: false })
    );

    // ============================================================================
    // MANUFACTURERS - Load once on service creation
    // ============================================================================

    this.manufacturers$ = this.vehicleApi.getManufacturers().pipe(
      catchError(error => {
        console.error('Error loading manufacturers:', error);
        return of([]);
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    // ============================================================================
    // MODELS - Load when manufacturer changes
    // ============================================================================

    this.models$ = this.filters$.pipe(
      map(filters => filters.manufacturer),
      distinctUntilChanged(),
      switchMap(manufacturer => {
        if (!manufacturer) {
          return of([]);
        }
        return this.vehicleApi.getModels(manufacturer).pipe(
          catchError(error => {
            console.error('Error loading models:', error);
            return of([]);
          })
        );
      }),
      startWith([]),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    // ============================================================================
    // AVAILABLE FILTERS - Load when manufacturer/model changes
    // ============================================================================

    this.availableFilters$ = this.filters$.pipe(
      map(filters => ({ manufacturer: filters.manufacturer, model: filters.model })),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
      switchMap(({ manufacturer, model }) => {
        return this.vehicleApi.getFilters(manufacturer || undefined, model || undefined).pipe(
          catchError(error => {
            console.error('Error loading filters:', error);
            return of(null);
          })
        );
      }),
      startWith(null),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    // ============================================================================
    // COMPUTED STATE
    // ============================================================================

    this.hasResults$ = this.vehicles$.pipe(
      map(vehicles => vehicles.length > 0)
    );

    // Subscribe to keep cached values updated for synchronous localStorage saves
    this.filters$.subscribe(filters => this.currentFilters = filters);
    this.pagination$.subscribe(pagination => this.currentPagination = pagination);
    this.sortState$.subscribe(sort => this.currentSort = sort);
  }

  // ============================================================================
  // PUBLIC API - Action Dispatchers
  // ============================================================================
  // These are simple, synchronous methods that dispatch actions.
  // All coordination and side effects are handled by the reactive streams.

  /**
   * Initialize filters from URL params or localStorage
   * Call this once when component initializes
   *
   * Professional pattern - Priority hierarchy:
   * 1. URL with params → Use URL (external links, bookmarks, page refresh with params)
   * 2. URL without params + localStorage → Restore from storage (in-app nav, page refresh)
   * 3. URL without params + no localStorage → Empty filters (first visit, browse-first)
   *
   * Note: When restoring from localStorage, URL will be synced automatically
   * via the component's combineLatest subscription (maintains URL-first principle)
   */
  initialize(urlParams?: any): void {
    if (urlParams && Object.keys(urlParams).length > 0) {
      // Priority 1: URL params present - use them (highest priority)
      const filters: VehicleSearchFilters = {};

      if (urlParams.manufacturer) {
        filters.manufacturer = urlParams.manufacturer;
      }
      if (urlParams.model) {
        filters.model = urlParams.model;
      }
      if (urlParams.body_class) {
        filters.body_class = urlParams.body_class;
      }
      if (urlParams.year) {
        filters.year = parseInt(urlParams.year, 10);
      }

      // Dispatch initialize action with parsed filters
      this.initializeAction$.next(filters);

      // Handle pagination from URL
      // IMPORTANT: Set page size FIRST, then page, because changePageSize resets to page 1
      if (urlParams.page || urlParams.limit) {
        const limit = urlParams.limit ? parseInt(urlParams.limit, 10) : 20;
        if (limit !== 20) {
          this.changePageSizeAction$.next(limit);
        }

        const page = urlParams.page ? parseInt(urlParams.page, 10) : 1;
        if (page > 1) {
          this.changePageAction$.next(page);
        }
      }

      // Handle sort from URL
      if (urlParams.sortBy && urlParams.sortOrder) {
        this.sortByColumnAction$.next({
          sortBy: urlParams.sortBy,
          sortOrder: urlParams.sortOrder as 'asc' | 'desc'
        });
      }

      // Save URL params to localStorage so they persist on future visits
      // This enables bookmark persistence: arrive via URL → save → return with clean URL → restore
      this.saveCurrentState();
    } else {
      // Priority 2: No URL params - try to restore from localStorage
      const stored = this.loadFromLocalStorage();

      if (stored) {
        // Restore filters from localStorage
        this.initializeAction$.next(stored.filters);

        // Restore pagination from localStorage
        // IMPORTANT: Set page size FIRST, then page, because changePageSize resets to page 1
        if (stored.pagination.limit !== 20) {
          this.changePageSizeAction$.next(stored.pagination.limit);
        }
        if (stored.pagination.page > 1) {
          this.changePageAction$.next(stored.pagination.page);
        }

        // Restore sort from localStorage
        if (stored.sort && stored.sort.sortBy && stored.sort.sortOrder) {
          this.sortByColumnAction$.next(stored.sort);
        }

        // URL will be automatically synced by component's subscription
        // This maintains URL-first principle even when restoring from storage
      }
      // Priority 3: No URL params, no localStorage → defaults to empty (browse-first)
    }
  }

  /**
   * Select a manufacturer (resets model selection)
   */
  selectManufacturer(manufacturer: string | null): void {
    this.selectManufacturerAction$.next(manufacturer);
    this.saveCurrentState();
  }

  /**
   * Select a model
   */
  selectModel(model: string | null): void {
    this.selectModelAction$.next(model);
    this.saveCurrentState();
  }

  /**
   * Update filters (partial update)
   */
  updateFilters(filters: Partial<VehicleSearchFilters>): void {
    this.updateFiltersAction$.next(filters);
    this.saveCurrentState();
  }

  /**
   * Change to a specific page
   */
  changePage(page: number): void {
    this.changePageAction$.next(page);
    this.saveCurrentState();
  }

  /**
   * Change page size (resets to page 1)
   */
  changePageSize(limit: number): void {
    this.changePageSizeAction$.next(limit);
    this.saveCurrentState();
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.clearFiltersAction$.next();
    // Also clear sort when clearing filters
    this.clearSortAction$.next();
    // Also clear localStorage when user explicitly clears filters
    this.clearLocalStorage();
  }

  /**
   * Sort by column
   */
  sortByColumn(sortBy: string, sortOrder: 'asc' | 'desc'): void {
    this.sortByColumnAction$.next({ sortBy, sortOrder });
    this.saveCurrentState();
  }

  /**
   * Clear sort
   */
  clearSort(): void {
    this.clearSortAction$.next();
    this.saveCurrentState();
  }

  // ============================================================================
  // PRIVATE HELPERS - localStorage operations with versioning and error handling
  // ============================================================================

  /**
   * Save current state to localStorage (imperative helper)
   * Uses cached values for synchronous operation
   * This is called explicitly after each action method
   */
  private saveCurrentState(): void {
    this.saveToLocalStorage(this.currentFilters, this.currentPagination, this.currentSort);
  }

  /**
   * Save current state to localStorage
   * Includes versioning and timestamp for migrations and expiration
   */
  private saveToLocalStorage(filters: VehicleSearchFilters, pagination: Pagination, sort: SortState): void {
    try {
      const state: StoredState = {
        version: this.STORAGE_VERSION,
        filters,
        pagination: {
          page: pagination.page,
          limit: pagination.limit
        },
        sort,
        timestamp: Date.now()
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      // localStorage might be full, disabled, or in private mode
      console.warn('Failed to save state to localStorage:', error);
    }
  }

  /**
   * Load state from localStorage with version checking and expiration
   * Returns null if storage is empty, expired, or invalid
   */
  private loadFromLocalStorage(): StoredState | null {
    try {
      const json = localStorage.getItem(this.STORAGE_KEY);
      if (!json) {
        return null;
      }

      const stored: StoredState = JSON.parse(json);

      // Check if data is too old (expired)
      if (stored.timestamp && (Date.now() - stored.timestamp > this.MAX_AGE_MS)) {
        console.info('Stored state expired, clearing');
        this.clearLocalStorage();
        return null;
      }

      // Version migration support (for future schema changes)
      if (!stored.version || stored.version !== this.STORAGE_VERSION) {
        console.info('Stored state version mismatch, migrating');
        return this.migrateStoredState(stored);
      }

      return stored;
    } catch (error) {
      // JSON parse error or localStorage access error
      console.warn('Failed to load state from localStorage:', error);
      this.clearLocalStorage();
      return null;
    }
  }

  /**
   * Clear localStorage (called when user explicitly clears filters)
   */
  private clearLocalStorage(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  }

  /**
   * Migrate old storage formats to current version
   * Currently just returns null (no old versions to migrate from)
   */
  private migrateStoredState(oldState: any): StoredState | null {
    // Future: Add migration logic here when schema changes
    // For now, just ignore old versions
    console.warn('Cannot migrate old state version, using defaults');
    return null;
  }
}
