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
    // Don't initialize in constructor to avoid NG0900 errors
    // Component will call initialize() explicitly when ready
  }

  // Helper method to update state outside change detection cycle
  private updateState<T>(subject: BehaviorSubject<T>, value: T): void {
    setTimeout(() => subject.next(value), 0);
  }

  initialize(): void {
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
      next: (data) => this.updateState(this.manufacturersSubject, data),
      error: (error) => console.error('Error loading manufacturers:', error)
    });
  }

  loadAvailableFilters(manufacturer?: string, model?: string): void {
    this.vehicleApi.getFilters(manufacturer, model).subscribe({
      next: (data) => this.updateState(this.availableFiltersSubject, data),
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

    this.updateState(this.filtersSubject, newFilters);
    this.updateState(this.modelsSubject, []);  // Clear models

    if (name) {
      // Load models for selected manufacturer
      this.vehicleApi.getModels(name).subscribe({
        next: (data) => this.updateState(this.modelsSubject, data),
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

    this.updateState(this.filtersSubject, newFilters);
    this.search(newFilters);
  }

  updateFilters(filters: Partial<VehicleSearchFilters>): void {
    const currentFilters = this.filtersSubject.value;
    const newFilters: VehicleSearchFilters = { ...currentFilters, ...filters };

    this.updateState(this.filtersSubject, newFilters);

    // Reset to page 1 when filters change
    const currentPagination = this.paginationSubject.value;
    this.updateState(this.paginationSubject, { ...currentPagination, page: 1 });

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

    this.updateState(this.loadingSubject, true);

    this.vehicleApi.searchVehicles(params).pipe(
      finalize(() => this.updateState(this.loadingSubject, false))
    ).subscribe({
      next: (response) => {
        this.updateState(this.vehiclesSubject, response.data);
        this.updateState(this.paginationSubject, response.pagination);
        this.saveState();
      },
      error: (error) => {
        console.error('Error searching vehicles:', error);
        this.updateState(this.vehiclesSubject, []);
      }
    });
  }

  changePage(page: number): void {
    const pagination = this.paginationSubject.value;
    const newPagination = { ...pagination, page };
    this.updateState(this.paginationSubject, newPagination);
    // Call search after state update completes
    setTimeout(() => this.search(), 0);
  }

  changePageSize(limit: number): void {
    const pagination = this.paginationSubject.value;
    const newPagination = { ...pagination, limit, page: 1 };
    this.updateState(this.paginationSubject, newPagination);
    // Call search after state update completes
    setTimeout(() => this.search(), 0);
  }

  clearFilters(): void {
    this.updateState(this.filtersSubject, {});
    this.updateState(this.modelsSubject, []);
    this.loadAvailableFilters();

    // Reset pagination
    const currentPagination = this.paginationSubject.value;
    this.updateState(this.paginationSubject, { ...currentPagination, page: 1 });

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
          this.updateState(this.filtersSubject, state.filters);

          // If manufacturer was selected, load its models
          if (state.filters.manufacturer) {
            this.vehicleApi.getModels(state.filters.manufacturer).subscribe({
              next: (data) => this.updateState(this.modelsSubject, data),
              error: (error) => console.error('Error loading models:', error)
            });

            this.loadAvailableFilters(state.filters.manufacturer, state.filters.model);
          }
        }

        if (state.pagination) {
          this.updateState(this.paginationSubject, state.pagination);
        }
      }
    } catch (error) {
      console.error('Error restoring state from localStorage:', error);
    }
  }
}
