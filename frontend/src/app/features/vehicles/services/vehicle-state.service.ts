import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import {
  VehicleService,
  Manufacturer,
  Model,
  Vehicle,
  Filters
} from '../../../services/vehicle.service';
import { VehicleSearchFilters, Pagination } from '../models/vehicle.model';

@Injectable({
  providedIn: 'root'
})
export class VehicleStateService {
  // Private state subjects
  private manufacturersSubject = new BehaviorSubject<Manufacturer[]>([]);
  private modelsSubject = new BehaviorSubject<Model[]>([]);
  private vehiclesSubject = new BehaviorSubject<Vehicle[]>([]);
  private filtersSubject = new BehaviorSubject<VehicleSearchFilters>({});
  private availableFiltersSubject = new BehaviorSubject<Filters | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private paginationSubject = new BehaviorSubject<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  // Public observables (read-only)
  manufacturers$ = this.manufacturersSubject.asObservable();
  models$ = this.modelsSubject.asObservable();
  vehicles$ = this.vehiclesSubject.asObservable();
  filters$ = this.filtersSubject.asObservable();
  availableFilters$ = this.availableFiltersSubject.asObservable();
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

    // Load available filters
    this.loadAvailableFilters();

    // Restore state from localStorage
    this.restoreState();

    // Don't auto-trigger search - let the component decide when to search
    // This prevents change detection issues during initialization
  }

  loadManufacturers(): void {
    this.vehicleApi.getManufacturers().subscribe({
      next: (data) => this.manufacturersSubject.next(data),
      error: (error) => console.error('Error loading manufacturers:', error)
    });
  }

  loadAvailableFilters(manufacturer?: string, model?: string): void {
    this.vehicleApi.getFilters(manufacturer, model).subscribe({
      next: (data) => this.availableFiltersSubject.next(data),
      error: (error) => console.error('Error loading filters:', error)
    });
  }

  selectManufacturer(name: string | null): void {
    const currentFilters = this.filtersSubject.value;
    const newFilters: VehicleSearchFilters = {
      ...currentFilters,
      manufacturer: name,
      model: null  // Reset model when manufacturer changes
    };

    this.filtersSubject.next(newFilters);
    this.modelsSubject.next([]);  // Clear models

    if (name) {
      // Load models for selected manufacturer
      this.vehicleApi.getModels(name).subscribe({
        next: (data) => this.modelsSubject.next(data),
        error: (error) => console.error('Error loading models:', error)
      });

      // Load filters for selected manufacturer
      this.loadAvailableFilters(name);
    } else {
      // Load all filters
      this.loadAvailableFilters();
    }

    this.search(newFilters);
  }

  selectModel(name: string | null): void {
    const currentFilters = this.filtersSubject.value;
    const newFilters: VehicleSearchFilters = { ...currentFilters, model: name };

    this.filtersSubject.next(newFilters);
    this.search(newFilters);
  }

  updateFilters(filters: Partial<VehicleSearchFilters>): void {
    const currentFilters = this.filtersSubject.value;
    const newFilters: VehicleSearchFilters = { ...currentFilters, ...filters };

    this.filtersSubject.next(newFilters);

    // Reset to page 1 when filters change
    const currentPagination = this.paginationSubject.value;
    this.paginationSubject.next({ ...currentPagination, page: 1 });

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
    ).subscribe({
      next: (response) => {
        this.vehiclesSubject.next(response.data);
        this.paginationSubject.next(response.pagination);
        this.saveState();
      },
      error: (error) => {
        console.error('Error searching vehicles:', error);
        this.vehiclesSubject.next([]);
      }
    });
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
    this.loadAvailableFilters();

    // Reset pagination
    const currentPagination = this.paginationSubject.value;
    this.paginationSubject.next({ ...currentPagination, page: 1 });

    this.search({});
  }

  private saveState(): void {
    const state = {
      filters: this.filtersSubject.value,
      pagination: this.paginationSubject.value
    };
    try {
      localStorage.setItem('vehicleSearchState', JSON.stringify(state));
    } catch (error) {
      console.error('Error saving state to localStorage:', error);
    }
  }

  private restoreState(): void {
    try {
      const saved = localStorage.getItem('vehicleSearchState');
      if (saved) {
        const state = JSON.parse(saved);

        if (state.filters) {
          this.filtersSubject.next(state.filters);

          // If manufacturer was selected, load its models
          if (state.filters.manufacturer) {
            this.vehicleApi.getModels(state.filters.manufacturer).subscribe({
              next: (data) => this.modelsSubject.next(data),
              error: (error) => console.error('Error loading models:', error)
            });

            this.loadAvailableFilters(state.filters.manufacturer, state.filters.model);
          }
        }

        if (state.pagination) {
          this.paginationSubject.next(state.pagination);
        }
      }
    } catch (error) {
      console.error('Error restoring state from localStorage:', error);
    }
  }
}
