/**
 * Product service — provides a clean API for fetching products.
 *
 * Fetches from the real backend at GET /api/v1/products.
 * No mock fallback — errors propagate to the caller.
 */

import type { PaginatedResponse } from "../../../shared/types/api.types";
import type { Product } from "../../../app/data/products";
import axiosClient from "../../../lib/axiosClient";
import { adaptBackendProduct } from "../../../shared/types/product.types";
import type { BackendPaginatedProducts, BackendSingleProduct } from "../../../shared/types/product.types";

// ============================================================
// 1. Fetch products with filters, sorting, and pagination
// ============================================================

export interface FetchProductsParams {
  category?: string;
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
  /** Comma-separated hex codes, e.g. "#FFF,#000" */
  colors?: string;
  /** Minimum price filter */
  minPrice?: number;
  /** Maximum price filter */
  maxPrice?: number;
}

/**
 * Map frontend sort value to backend sort value.
 * Backend only supports: newest, rating
 * price-asc and price-desc are NOT supported (return 400).
 * "popular" is not supported — fallback to no sort param.
 * "oldest" is not supported — fallback to no sort param (backend default).
 */
function mapSort(sort: string | undefined): string | undefined {
  if (!sort) return undefined;
  // Only pass through sort values the backend actually supports
  const validSorts = ["newest", "rating"];
  if (validSorts.includes(sort)) return sort;
  // "popular", "price-asc", "price-desc", "oldest" are not supported by the backend
  return undefined;
}

/**
 * Fetch products from the real backend with full filter + sort + pagination.
 * Throws on error — no mock fallback.
 */
export async function fetchProducts(
  params: FetchProductsParams = {}
): Promise<PaginatedResponse<Product>> {
  // Build query params for the backend
  const queryParams: Record<string, string | number | boolean> = {};

    if (params.category && params.category !== "all") {
    queryParams.category = params.category;
  }
  if (params.search) queryParams.search = params.search;
  
  // Map frontend sort to backend sort string
  const mappedSort = mapSort(params.sort);
  if (mappedSort) queryParams.sort = mappedSort;
  
  if (params.page) queryParams.page = params.page;
  if (params.limit) queryParams.limit = params.limit;

  // Server-side filtering — pass through to backend
  if (params.colors) queryParams.colors = params.colors;
    if (params.minPrice !== undefined) queryParams.minPrice = params.minPrice;
  if (params.maxPrice !== undefined) queryParams.maxPrice = params.maxPrice;

  const { data: response } = await axiosClient.get("/products", {
    params: queryParams,
  });

  // Backend returns: { status: "success", data: { products: [...], total, page, limit, totalPages } }
  const backendData: BackendPaginatedProducts = response.data;

  // Adapt backend products to frontend Product shape
  const adaptedProducts: Product[] = backendData.products.map(adaptBackendProduct);

  return {
    data: adaptedProducts,
    page: backendData.page,
    totalPages: backendData.totalPages,
    totalItems: backendData.total,
  };
}

// ============================================================
// 2. Fetch single product by ID
// ============================================================

export async function fetchProductById(id: string): Promise<Product | null> {
  const { data: response } = await axiosClient.get(`/products/${id}`);
  // Backend returns: { status: "success", data: { product: {...} } }
  const backendData: BackendSingleProduct = response.data;
  return adaptBackendProduct(backendData.product);
}

// ============================================================
// Export
// ============================================================

export type { Product };