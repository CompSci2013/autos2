/**
 * Vehicle data model matching Elasticsearch schema
 */
export interface Vehicle {
  // Core identification
  vehicle_id: string;

  // Manufacturer and model
  manufacturer: string;
  model: string;

  // Year
  year: number;

  // Body style and class
  body_style?: string;
  body_class?: string;

  // VIN
  vin?: string;

  // Engine specifications
  engine_type?: string;
  engine_cylinders?: number;
  engine_displacement_l?: number;
  engine_hp?: number;

  // Transmission and drivetrain
  transmission_type?: string;
  transmission_speeds?: number;
  drive_type?: string;

  // Metadata
  data_source?: string;
  ingested_at?: string;
}

/**
 * Manufacturer with aggregated counts
 */
export interface Manufacturer {
  name: string;
  vehicle_count: number;
  model_count: number;
}

/**
 * Model with aggregated data
 */
export interface Model {
  name: string;
  vehicle_count: number;
  year_range: {
    min: number;
    max: number;
  };
}

/**
 * Filter option with count
 */
export interface FilterOption {
  value: string;
  count: number;
}

/**
 * Available filters response
 */
export interface Filters {
  body_classes: FilterOption[];
  body_styles: FilterOption[];
  years: {
    min: number;
    max: number;
  };
  engine_types: FilterOption[];
  drive_types: FilterOption[];
  transmission_types: FilterOption[];
}

/**
 * Pagination metadata
 */
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

/**
 * Search query parameters
 */
export interface SearchParams {
  manufacturers?: string[];
  models?: string[];
  year_min?: number;
  year_max?: number;
  body_class?: string[];
  body_style?: string[];
  engine_type?: string[];
  drive_type?: string[];
  transmission_type?: string[];
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

/**
 * Vehicle search response
 */
export interface VehicleSearchResponse {
  vehicles: Vehicle[];
  pagination: Pagination;
  filters_applied: {
    [key: string]: string[];
  };
}

/**
 * Database statistics
 */
export interface DatabaseStats {
  total_vehicles: number;
  total_manufacturers: number;
  total_models: number;
  year_range: {
    min: number;
    max: number;
  };
  data_sources: Array<{
    source: string;
    count: number;
  }>;
}
