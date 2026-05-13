/**
 * Product service — provides a clean API for fetching products.
 *
 * Currently uses local mock data so the frontend works without a backend.
 * When the backend is ready, uncomment the axios import and switch to real API calls.
 */

import type { PaginatedResponse, ProductQueryParams } from "../../../shared/types/api.types";
import type { Product } from "../../../app/data/products";
import { products, getDynamicFilters } from "../../../app/data/products";
import { getBasePrice } from "../../../app/data/products";
import { mockPaginatedResponse } from "../../../shared/services/api";

// ============================================================
// 1. Fetch products with filters, sorting, and pagination
// ============================================================

export interface FetchProductsParams extends ProductQueryParams {
  category?: string;
  search?: string;
  color?: string;
  material?: string;
  weight?: string;
  difficulty?: string;
  sort?: string;
  page?: number;
  limit?: number;
  minPrice?: number;
  maxPrice?: number;
}

/**
 * Fetch products with full filter + sort + pagination support.
 *
 * Currently uses local mock data with simulated pagination.
 * Replace the body with a real axios call when backend is ready:
 *
 *   const { data } = await api.get<PaginatedResponse<Product>>(
 *     `/products?${buildQueryString(params)}`
 *   );
 *   return data;
 */
export async function fetchProducts(
  params: FetchProductsParams = {}
): Promise<PaginatedResponse<Product>> {
  const {
    category,
    search,
    color,
    material,
    weight,
    difficulty,
    sort = "popular",
    page = 1,
    limit = 12,
    minPrice,
    maxPrice,
  } = params;

  // --- Filtering (mirrors backend logic) ---
  let result = [...products];

  // Category
  if (category && category !== "all") {
    result = result.filter((p) => p.category === category);
  }

  // Search (name, description, tags, material, difficulty, variant colors)
  if (search) {
    const query = search.toLowerCase();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.tags.some((t) => t.toLowerCase().includes(query)) ||
        p.category.toLowerCase().includes(query) ||
        (p.material && p.material.toLowerCase().includes(query)) ||
        (p.difficulty && p.difficulty.toLowerCase().includes(query)) ||
        p.variants?.some((v) => v.color && v.color.toLowerCase().includes(query))
    );
  }

  // Color (comma-separated: "Blush Pink,Cream")
  if (color) {
    const colors = color.split(",").map((c) => c.trim()).filter(Boolean);
    if (colors.length > 0) {
      result = result.filter((p) =>
        p.variants?.some((v) => v.color && colors.includes(v.color))
      );
    }
  }

  // Material (comma-separated)
  if (material) {
    const materials = material.split(",").map((m) => m.trim()).filter(Boolean);
    if (materials.length > 0) {
      result = result.filter(
        (p) => p.material && materials.includes(p.material)
      );
    }
  }

  // Weight (comma-separated)
  if (weight) {
    const weights = weight.split(",").map((w) => w.trim()).filter(Boolean);
    if (weights.length > 0) {
      result = result.filter(
        (p) => p.weight && weights.includes(p.weight)
      );
    }
  }

  // Difficulty (comma-separated)
  if (difficulty) {
    const difficulties = difficulty.split(",").map((d) => d.trim()).filter(Boolean);
    if (difficulties.length > 0) {
      result = result.filter(
        (p) => p.difficulty && difficulties.includes(p.difficulty)
      );
    }
  }

  // Price range
  if (minPrice !== undefined && minPrice > 0) {
    result = result.filter((p) =>
      Math.max(...(p.variants?.map((v) => v.price) ?? [0])) >= minPrice
    );
  }
  if (maxPrice !== undefined && maxPrice > 0) {
    result = result.filter((p) =>
      Math.min(...(p.variants?.map((v) => v.price) ?? [0])) <= maxPrice
    );
  }

  // --- Sorting ---
  switch (sort) {
    case "newest":
      result.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      break;
    case "price-low":
      result.sort((a, b) => getBasePrice(a) - getBasePrice(b));
      break;
    case "price-high":
      result.sort((a, b) => getBasePrice(b) - getBasePrice(a));
      break;
    case "popular":
      result.sort((a, b) => b.popularity - a.popularity);
      break;
    case "rating":
      result.sort((a, b) => b.rating - a.rating);
      break;
  }

  // --- Pagination via mock adapter ---
  return mockPaginatedResponse(result, page, limit);
}

// ============================================================
// 2. Fetch single product by ID
// ============================================================

export async function fetchProductById(id: string): Promise<Product | null> {
  // Mock: find in local data
  // Real: const { data } = await api.get<Product>(`/products/${id}`); return data.data;
  return products.find((p) => p.id === id) ?? null;
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

/**
 * Returns available filter options derived from the current product set.
 * In a real backend, this would be: GET /api/products/filters
 */
export function fetchFilterOptions(): DynamicFilterOptions {
  return getDynamicFilters(products);
}

// ============================================================
// 4. Export for future use
// ============================================================

export type { Product };