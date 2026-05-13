/** Standard API paginated response */
export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  totalPages: number;
  totalItems: number;
}

/** Standard API single-item response */
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

/** Standard API error response */
export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

/** Query params used for listing products */
export interface ProductQueryParams {
  category?: string;
  search?: string;
  color?: string;       // comma-separated
  material?: string;    // comma-separated
  weight?: string;      // comma-separated
  difficulty?: string;  // comma-separated
  sort?: string;
  page?: number;
  limit?: number;
  minPrice?: number;
  maxPrice?: number;
}

/** Sort options available for product listing */
export type ProductSortOption = "newest" | "price-low" | "price-high" | "popular" | "rating";