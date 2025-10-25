import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subject, combineLatest } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, skip } from 'rxjs/operators';
import {
  Manufacturer,
  Model,
  Vehicle,
  Filters
} from '../../services/vehicle.service';
import { VehicleStateService } from '../../features/vehicles/services/vehicle-state.service';
import { VehicleSearchFilters, Pagination } from '../../features/vehicles/models/vehicle.model';

@Component({
  selector: 'app-discover',
  templateUrl: './discover.component.html',
  styleUrls: ['./discover.component.scss']
})
export class DiscoverComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Expose observables directly - async pipe handles subscriptions
  manufacturers$: Observable<Manufacturer[]> = this.state.manufacturers$;
  models$: Observable<Model[]> = this.state.models$;
  vehicles$: Observable<Vehicle[]> = this.state.vehicles$;
  availableFilters$: Observable<Filters | null> = this.state.availableFilters$;
  loading$: Observable<boolean> = this.state.loading$;
  pagination$: Observable<Pagination> = this.state.pagination$;

  // Local property for two-way binding with form controls
  searchFilters: VehicleSearchFilters = {
    manufacturer: null,
    model: null,
    body_class: null,
    year: null
  };

  // Track current sort state for column headers
  currentSort: { sortBy: string | null; sortOrder: 'asc' | 'desc' | null } = {
    sortBy: null,
    sortOrder: null
  };

  constructor(
    private state: VehicleStateService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Initialize from URL params ONCE on page load
    const initialParams = this.route.snapshot.queryParams;
    this.state.initialize(initialParams);

    // Sync local searchFilters with state (needed for ngModel binding)
    this.state.filters$
      .pipe(takeUntil(this.destroy$))
      .subscribe(filters => {
        this.searchFilters = { ...filters };
      });

    // Sync current sort state (for column header indicators)
    this.state.sortState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(sort => {
        this.currentSort = sort;
      });

    // Subscribe to state changes to update URL
    combineLatest([
      this.state.filters$,
      this.state.pagination$,
      this.state.sortState$
    ])
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300), // Debounce to avoid excessive URL updates
        distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
      )
      .subscribe(([filters, pagination, sort]) => {
        this.updateUrlParams(filters, pagination, sort);
      });

    // Handle browser back/forward navigation
    // Skip first emission (initial load) - after that, URL changes are browser navigation
    this.route.queryParams
      .pipe(
        skip(1), // Skip initial emission (we already initialized above)
        takeUntil(this.destroy$),
        distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
      )
      .subscribe(params => {
        // Browser back/forward detected - re-initialize from URL
        this.state.initialize(params);
      });
  }

  onManufacturerChange(): void {
    this.state.selectManufacturer(this.searchFilters.manufacturer || null);
  }

  onSearchChange(): void {
    // Called when model or body_class dropdowns change
    this.state.updateFilters(this.searchFilters);
  }

  clearFilters(): void {
    this.state.clearFilters();
  }

  onPageChange(page: number): void {
    this.state.changePage(page);
  }

  onPageSizeChange(size: number): void {
    this.state.changePageSize(size);
  }

  getStartRecord(pagination: Pagination): number {
    if (pagination.total === 0) return 0;
    return (pagination.page - 1) * pagination.limit + 1;
  }

  getEndRecord(pagination: Pagination): number {
    const end = pagination.page * pagination.limit;
    return Math.min(end, pagination.total);
  }

  getSortOrder(columnName: string): 'asc' | 'desc' | null {
    if (this.currentSort.sortBy === columnName) {
      return this.currentSort.sortOrder;
    }
    return null;
  }

  onSortChange(columnName: string, sortOrder: 'asc' | 'desc' | null): void {
    if (sortOrder === null) {
      // Clear sort when clicking on already-sorted column for the third time
      this.state.clearSort();
    } else {
      // Sort by this column
      this.state.sortByColumn(columnName, sortOrder);
    }
  }

  private updateUrlParams(
    filters: VehicleSearchFilters,
    pagination: Pagination,
    sort: { sortBy: string | null; sortOrder: 'asc' | 'desc' | null }
  ): void {
    // Build query params object
    const queryParams: any = {};

    // Add filter params (only if they have values)
    if (filters.manufacturer) {
      queryParams.manufacturer = filters.manufacturer;
    }
    if (filters.model) {
      queryParams.model = filters.model;
    }
    if (filters.body_class) {
      queryParams.body_class = filters.body_class;
    }
    if (filters.year) {
      queryParams.year = filters.year;
    }

    // Add pagination params (only if different from defaults)
    if (pagination.page !== 1) {
      queryParams.page = pagination.page;
    }
    if (pagination.limit !== 20) {
      queryParams.limit = pagination.limit;
    }

    // Add sort params (only if set)
    if (sort.sortBy && sort.sortOrder) {
      queryParams.sortBy = sort.sortBy;
      queryParams.sortOrder = sort.sortOrder;
    }

    // Update URL without reloading the page
    // Don't use 'merge' - replace all params to properly clear removed ones
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: queryParams,
      replaceUrl: false // Use false to enable back/forward navigation
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
