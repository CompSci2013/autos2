import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Stats {
  total_vehicles: number;
  total_manufacturers: number;
  body_class_distribution: any[];
}

export interface Manufacturer {
  name: string;
  vehicle_count: number;
  model_count: number;
}

export interface Model {
  name: string;
  vehicle_count: number;
  year_range: {
    min: number;
    max: number;
  };
}

export interface Vehicle {
  vehicle_id: string;
  manufacturer: string;
  model: string;
  year: number;
  body_class?: string;
  body_style?: string;
  engine_model?: string;
  engine_cylinders?: number;
  transmission_style?: string;
  drive_type?: string;
  data_source?: string;
  ingested_at?: string;
}

export interface VehicleSearchResponse {
  data: Vehicle[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Filters {
  body_classes: Array<{ value: string; count: number }>;
  body_styles: Array<{ value: string; count: number }>;
  drive_types: Array<{ value: string; count: number }>;
  transmission_styles: Array<{ value: string; count: number }>;
}

@Injectable({
  providedIn: 'root'
})
export class VehicleService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getStats(): Observable<Stats> {
    return this.http.get<Stats>(`${this.apiUrl}/stats`);
  }

  getManufacturers(): Observable<Manufacturer[]> {
    return this.http.get<{ manufacturers: Manufacturer[]; total: number }>(`${this.apiUrl}/manufacturers`)
      .pipe(map(response => response.manufacturers));
  }

  getModels(manufacturer: string): Observable<Model[]> {
    return this.http.get<{ manufacturer: string; models: Model[]; total: number }>(`${this.apiUrl}/manufacturers/${manufacturer}/models`)
      .pipe(map(response => response.models));
  }

  searchVehicles(filters: any): Observable<VehicleSearchResponse> {
    let params = new HttpParams();

    // Backend expects plural "manufacturers" and "models" as arrays
    if (filters.manufacturer) params = params.set('manufacturers', filters.manufacturer);
    if (filters.model) params = params.set('models', filters.model);

    // Backend expects year_min and year_max for range filtering (NOT 'year')
    if (filters.year_min) params = params.set('year_min', filters.year_min);
    if (filters.year_max) params = params.set('year_max', filters.year_max);

    if (filters.body_class) params = params.set('body_class', filters.body_class);
    if (filters.page) params = params.set('page', filters.page);
    if (filters.limit) params = params.set('limit', filters.limit);

    // Add sort parameters if provided
    if (filters.sort) params = params.set('sort', filters.sort);
    if (filters.order) params = params.set('order', filters.order);

    return this.http.get<{ vehicles: Vehicle[]; pagination: any }>(`${this.apiUrl}/vehicles`, { params })
      .pipe(map(response => ({
        data: response.vehicles,
        pagination: {
          page: response.pagination.page,
          limit: response.pagination.limit,
          total: response.pagination.total,
          totalPages: response.pagination.total_pages  // Map snake_case to camelCase
        }
      })));
  }

  getFilters(manufacturer?: string, model?: string): Observable<Filters> {
    let params = new HttpParams();
    if (manufacturer) params = params.set('manufacturer', manufacturer);
    if (model) params = params.set('model', model);

    return this.http.get<Filters>(`${this.apiUrl}/filters`, { params });
  }
}
