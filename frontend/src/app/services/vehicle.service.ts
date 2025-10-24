import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Stats {
  total_vehicles: number;
  total_manufacturers: number;
  body_class_distribution: any[];
}

export interface Manufacturer {
  name: string;
  count: number;
}

export interface Model {
  name: string;
  count: number;
}

export interface Vehicle {
  vin: string;
  year: number;
  make: string;
  model: string;
  body_class?: string;
  body_style?: string;
  engine_model?: string;
  engine_cylinders?: number;
  transmission_style?: string;
  drive_type?: string;
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
    return this.http.get<Manufacturer[]>(`${this.apiUrl}/manufacturers`);
  }

  getModels(manufacturer: string): Observable<Model[]> {
    return this.http.get<Model[]>(`${this.apiUrl}/manufacturers/${manufacturer}/models`);
  }

  searchVehicles(filters: any): Observable<VehicleSearchResponse> {
    let params = new HttpParams();

    if (filters.manufacturer) params = params.set('manufacturer', filters.manufacturer);
    if (filters.model) params = params.set('model', filters.model);
    if (filters.year) params = params.set('year', filters.year);
    if (filters.body_class) params = params.set('body_class', filters.body_class);
    if (filters.page) params = params.set('page', filters.page);
    if (filters.limit) params = params.set('limit', filters.limit);

    return this.http.get<VehicleSearchResponse>(`${this.apiUrl}/vehicles`, { params });
  }

  getFilters(manufacturer?: string, model?: string): Observable<Filters> {
    let params = new HttpParams();
    if (manufacturer) params = params.set('manufacturer', manufacturer);
    if (model) params = params.set('model', model);

    return this.http.get<Filters>(`${this.apiUrl}/filters`, { params });
  }
}
