import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  VehicleService,
  Manufacturer,
  Model,
  Vehicle,
  Filters
} from '../../services/vehicle.service';

@Component({
  selector: 'app-discover',
  templateUrl: './discover.component.html',
  styleUrls: ['./discover.component.scss']
})
export class DiscoverComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  manufacturers: Manufacturer[] = [];
  models: Model[] = [];
  vehicles: Vehicle[] = [];
  availableFilters: Filters | null = null;
  loading = false;

  searchFilters: any = {
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

  constructor(private vehicleService: VehicleService) { }

  ngOnInit(): void {
    this.loadManufacturers();
    this.loadFilters();
    this.searchVehicles();
  }

  loadManufacturers(): void {
    this.vehicleService.getManufacturers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.manufacturers = data;
        },
        error: (error) => {
          console.error('Error loading manufacturers:', error);
        }
      });
  }

  loadFilters(): void {
    this.vehicleService.getFilters()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.availableFilters = data;
        },
        error: (error) => {
          console.error('Error loading filters:', error);
        }
      });
  }

  onManufacturerChange(): void {
    this.searchFilters.model = null;
    this.models = [];

    if (this.searchFilters.manufacturer) {
      this.vehicleService.getModels(this.searchFilters.manufacturer)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (data) => {
            this.models = data;
          },
          error: (error) => {
            console.error('Error loading models:', error);
          }
        });

      this.vehicleService.getFilters(this.searchFilters.manufacturer)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (data) => {
            this.availableFilters = data;
          },
          error: (error) => {
            console.error('Error loading filters:', error);
          }
        });
    } else {
      this.loadFilters();
    }

    this.onSearchChange();
  }

  onSearchChange(): void {
    this.pagination.page = 1;
  }

  searchVehicles(): void {
    this.loading = true;

    const filters = {
      ...this.searchFilters,
      page: this.pagination.page,
      limit: this.pagination.limit
    };

    this.vehicleService.searchVehicles(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.vehicles = response.data;
          this.pagination = response.pagination;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error searching vehicles:', error);
          this.loading = false;
        }
      });
  }

  clearFilters(): void {
    this.searchFilters = {
      manufacturer: null,
      model: null,
      body_class: null,
      year: null
    };
    this.models = [];
    this.pagination.page = 1;
    this.loadFilters();
    this.searchVehicles();
  }

  onPageChange(page: number): void {
    this.pagination.page = page;
    this.searchVehicles();
  }

  onPageSizeChange(size: number): void {
    this.pagination.limit = size;
    this.pagination.page = 1;
    this.searchVehicles();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

}
