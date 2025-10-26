export interface VehicleSearchFilters {
  manufacturer?: string | null;
  model?: string | null;
  year?: number | null;  // Deprecated: Use year_min/year_max instead
  year_min?: number | null;
  year_max?: number | null;
  body_class?: string | null;
  page?: number;
  limit?: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
