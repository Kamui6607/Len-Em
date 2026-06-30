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
}

/**
 * Map frontend sort value to backend sort value.
 * Backend supports: newest, price-asc, price-desc, rating
 * "popular" is not supported — fallback to no sort param.
 */
function mapSort(sort: string | undefined): string | undefined {
  if (!sort) return undefined;
  // Only pass through sort values the backend actually supports
  const validSorts = ["newest", "price-asc", "price-desc", "rating"];
  if (validSorts.includes(sort)) return sort;
  // "popular" is not supported by the backend — omit sort entirely
  return undefined;
}

/**
 * Fetch products from the real backend with full filter + sort + pagination.
 * Throws on error — no mock fallback.
 * Only sends query params the backend actually supports:
 *   category, search, sort, page, limit
 */
export async function fetchProducts(
  params: FetchProductsParams = {}
): Promise<PaginatedResponse<Product>> {
  // Build query params for the backend
  const queryParams: Record<string, string | number | boolean> = {};

  if (params.category && params.category !== "all") {
    const catMap: Record<string, string> = {
      yarn: "yarn",
      tools: "hook",
      kit: "kit",
    };
    queryParams.category = catMap[params.category] || params.category;
  }
  if (params.search) queryParams.search = params.search;
  const mappedSort = mapSort(params.sort);
  if (mappedSort) queryParams.sort = mappedSort;
  if (params.page) queryParams.page = params.page;
  if (params.limit) queryParams.limit = params.limit;

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
// 3. Fetch dynamic filter options
// ============================================================

export interface DynamicFilterOptions {
  colors: { name: string; hex: string; count: number }[];
  materials: { name: string; count: number }[];
  weights: { name: string; count: number }[];
  difficulties: { name: string; count: number }[];
}

// ============================================================
// 4. Admin CRUD operations
// ============================================================

export interface CreateProductData {
  name: string;
  description: string;
  category: string;
  image: string;
  tags?: string[];
  variants: {
    color: string;
    hexCode: string;
    price: number;
    stock: number;
    image: string;
  }[];
  isActive?: boolean;
}

export interface UpdateProductData {
  name?: string;
  description?: string;
  category?: string;
  image?: string;
  tags?: string[];
  variants?: {
    color: string;
    hexCode: string;
    price: number;
    stock: number;
    image: string;
  }[];
  isActive?: boolean;
}

/**
 * Create a new product (Admin only)
 */
export async function createProduct(data: CreateProductData): Promise<BackendSingleProduct> {
  const { data: response } = await axiosClient.post("/products", data);
  return response.data;
}

/**
 * Update an existing product (Admin only)
 */
export async function updateProduct(id: string, data: UpdateProductData): Promise<BackendSingleProduct> {
  const { data: response } = await axiosClient.put(`/products/${id}`, data);
  return response.data;
}

/**
 * Soft delete a product (Admin only) — sets isActive = false
 */
export async function deleteProduct(id: string): Promise<void> {
  await axiosClient.delete(`/products/${id}`);
}

/**
 * Restore a soft-deleted product (Admin only) — sets isActive = true
 */
export async function restoreProduct(id: string): Promise<BackendSingleProduct> {
  const { data: response } = await axiosClient.patch(`/products/${id}`);
  return response.data;
}

// ============================================================
// 5. Export
// ============================================================

export type { Product };