import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchProducts } from "../../features/shop/services/product.service";
import type { PaginatedResponse } from "../types/api.types";
import type { Product } from "../../app/data/products";

export interface UseProductsQueryParams {
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
 * Fetch dữ liệu Product List từ server bằng TanStack Query.
 * - queryKey: ["products", "list", params] → cache riêng theo từng bộ params.
 * - staleTime: kế thừa từ global config (5 phút) → quay lại Shop không refetch nếu còn mới.
 * - retry: kế thừa global config (2 lần, retryDelay exponential).
 * - placeholderData: keepPreviousData → khi đổi filter/page, grid giữ nguyên
 *   dữ liệu cũ trong lúc fetch (KHÔNG nháy skeleton toàn grid → mượt hơn).
 */
export function useProductsQuery(params: UseProductsQueryParams) {
  return useQuery<PaginatedResponse<Product>>({
    queryKey: ["products", "list", params],
    queryFn: () => fetchProducts(params),
    placeholderData: keepPreviousData,
  });
}