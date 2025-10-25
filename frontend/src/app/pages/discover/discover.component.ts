import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
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
export class DiscoverComponent implements OnInit, AfterViewInit, OnDestroy {
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

  constructor(private state: VehicleStateService) { }

  ngOnInit(): void {
    // Sync local searchFilters with state (needed for ngModel binding)
    this.state.filters$
      .pipe(takeUntil(this.destroy$))
      .subscribe(filters => this.searchFilters = filters);
  }

  ngAfterViewInit(): void {
    // Initialize state service and trigger search after view initialization
    // This ensures change detection has completed before state updates
    setTimeout(() => {
      this.state.initialize();
      this.state.search();
    }, 0);
  }

  onManufacturerChange(): void {
    this.state.selectManufacturer(this.searchFilters.manufacturer || null);
  }

  onSearchChange(): void {
    this.state.updateFilters(this.searchFilters);
  }

  searchVehicles(): void {
    this.state.search(this.searchFilters);
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
