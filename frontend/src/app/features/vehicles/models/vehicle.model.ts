export interface VehicleSearchFilters {
  manufacturer?: string | null;
  model?: string | null;
  year?: number | null;
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
