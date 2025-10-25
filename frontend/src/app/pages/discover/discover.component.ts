import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  Manufacturer,
  Model,
  Vehicle,
  Filters
} from '../../services/vehicle.service';
import { VehicleStateService } from '../../features/vehicles/services/vehicle-state.service';
import { VehicleSearchFilters } from '../../features/vehicles/models/vehicle.model';

@Component({
  selector: 'app-discover',
  templateUrl: './discover.component.html',
  styleUrls: ['./discover.component.scss']
})
export class DiscoverComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Local properties bound to template (will be replaced with async pipe in Phase 2.2)
  manufacturers: Manufacturer[] = [];
  models: Model[] = [];
  vehicles: Vehicle[] = [];
  availableFilters: Filters | null = null;
  loading = false;

  searchFilters: VehicleSearchFilters = {
    manufacturer: null,
    model: null,
    body_class: null,
    year: null
  };

  pagination = {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  };

  constructor(private state: VehicleStateService) { }

  ngOnInit(): void {
    // Subscribe to state observables
    this.state.manufacturers$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => this.manufacturers = data);

    this.state.models$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => this.models = data);

    this.state.vehicles$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => this.vehicles = data);

    this.state.availableFilters$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => this.availableFilters = data);

    this.state.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => this.loading = data);

    this.state.filters$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => this.searchFilters = data);

    this.state.pagination$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => this.pagination = data);

    // Trigger initial search
    this.state.search();
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
