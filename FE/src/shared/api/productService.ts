// ============================================================
// Product Service â€” all API calls related to products
// ============================================================

import axiosClient from "../../lib/axiosClient";
import type { ApiResponse } from "../types/auth.types";

const PRODUCTS_BASE = "/products";

// BE chặn `limit > 100` (productQuerySchema) → dùng 100 khi cần gom toàn bộ.
const MAX_PAGE_LIMIT = 100;

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface ProductVariant {
  _idVariants: string;
  color: string;
  hexCode: string;
  price: number;
  stock: number;
  image?: string;
}

export interface Product {
  _id: string;
  id?: string;
  name: string;
  description: string;
  category: string;
  image: string;
  tags: string[];
  variants: ProductVariant[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductsListResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  category: string;
  image?: string;
  imageFile?: File | null;
  tags?: string[];
  variants: {
    color: string;
    hexCode: string;
    price: number;
    stock: number;
    image?: string;
    imageFile?: File | null;
  }[];
  isActive?: boolean;
}

export interface UpdateProductRequest {
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
    image?: string;
  }[];
  isActive?: boolean;
}

function buildProductFormData(data: CreateProductRequest): FormData {
  const formData = new FormData();
  const { imageFile, variants, ...productData } = data;
  const variantsWithoutFiles = variants.map(({ imageFile, ...variant }) => {
    void imageFile; // file gửi riêng qua field `variantImage_{index}`
    return variant;
  });

  formData.append("data", JSON.stringify({
    ...productData,
    variants: variantsWithoutFiles,
  }));

  if (imageFile) {
    formData.append("image", imageFile);
  }

  variants.forEach((variant, index) => {
    if (variant.imageFile) {
      formData.append(`variantImage_${index}`, variant.imageFile);
    }
  });

  return formData;
}

// â”€â”€â”€ Service â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const productService = {
  /** GET /products â€” List products (public, no token needed) */
  getAll: (params?: {
    page?: number;
    limit?: number;
    category?: string;
    tag?: string;
    search?: string;
    sort?: string;
    includeInactive?: boolean;
  }) =>
    axiosClient.get<ApiResponse<ProductsListResponse>>(PRODUCTS_BASE, { params }),

  /** GET /products/{productId} â€” Get product by ID (public) */
  getById: (productId: string) =>
    axiosClient.get<ApiResponse<{ product: Product }>>(`${PRODUCTS_BASE}/${productId}`),

  /**
   * GET /products (gom nhiều trang) — CHỈ trả về sản phẩm đã ẩn (`isActive === false`).
   *
   * BE không có tham số lọc `isActive=false`: chỉ có `includeInactive=true`
   * (trả về CẢ đang bán + đã ẩn, và chỉ áp dụng cho role Admin — xem
   * product.controller.js). Vì vậy phải gom toàn bộ các trang rồi lọc ở FE.
   * Số request = totalPages (limit tối đa 100/trang).
   */
  getHidden: async (params?: {
    category?: string;
    tag?: string;
    search?: string;
  }): Promise<Product[]> => {
    const fetchPage = async (page: number): Promise<ProductsListResponse | undefined> => {
      const { data } = await axiosClient.get<ApiResponse<ProductsListResponse>>(
        PRODUCTS_BASE,
        { params: { ...params, page, limit: MAX_PAGE_LIMIT, includeInactive: true } },
      );
      return data.data;
    };

    const first = await fetchPage(1);
    const all: Product[] = [...(first?.products ?? [])];
    const totalPages = first?.totalPages ?? 1;

    if (totalPages > 1) {
      const rest = await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, i) => fetchPage(i + 2)),
      );
      rest.forEach((pageData) => all.push(...(pageData?.products ?? [])));
    }

    return all.filter((product) => !product.isActive);
  },

  /** POST /products â€” Create a new product (Admin & Staff) */
    create: (data: CreateProductRequest) =>
    axiosClient.post<ApiResponse<{ product: Product }>>(
      PRODUCTS_BASE,
      buildProductFormData(data),
      { headers: { "Content-Type": "multipart/form-data" } }
    ),

  /** PUT /products/{productId} â€” Update product (Admin & Staff) */
  update: (productId: string, data: UpdateProductRequest) =>
    axiosClient.put<ApiResponse<{ product: Product }>>(`${PRODUCTS_BASE}/${productId}`, data),

  /** PATCH /products/{productId} â€” Restore soft-deleted product (Admin & Staff) */
  restore: (productId: string) =>
    axiosClient.patch<ApiResponse<{ product: Product }>>(`${PRODUCTS_BASE}/${productId}`),

  /** DELETE /products/{productId} â€” Soft delete product (Admin & Staff) */
  delete: (productId: string) =>
    axiosClient.delete<ApiResponse<{ deletedProduct: { _id: string; name: string } }>>(
      `${PRODUCTS_BASE}/${productId}`
    ),

    /** POST /products/{productId}/variants/{variantId}/rate — Rate a product variant with a score 1–5 */
  rateProduct: (productId: string, variantId: string, score: number) =>
    axiosClient.post<ApiResponse<{ product: Product }>>(
      `${PRODUCTS_BASE}/${productId}/variants/${variantId}/rate`,
      { score }
    ),

  /**
   * Helper to resolve variantId for an order item if missing.
   * Matches by color, hexCode, or price, or falls back to first variant.
   */
  resolveVariantId: async (item: {
    productId: string;
    variantId?: string;
    color?: string;
    hexCode?: string;
    price?: number;
  }): Promise<string | undefined> => {
    if (item.variantId) return item.variantId;
    try {
      const res = await productService.getById(item.productId);
      const product = res.data?.data?.product;
      if (product && product.variants && product.variants.length > 0) {
        const matched =
          product.variants.find((v) => {
            if (item.color && v.color && v.color.toLowerCase() === item.color.toLowerCase()) return true;
            if (item.hexCode && v.hexCode && v.hexCode.toLowerCase() === item.hexCode.toLowerCase()) return true;
            if (item.price !== undefined && v.price === item.price) return true;
            return false;
          }) || product.variants[0];
        return matched?._idVariants || (matched as any)?._id || (matched as any)?.id;
      }
    } catch (e) {
      console.warn("Failed to resolve variantId for product:", item.productId, e);
    }
    return undefined;
  },
};
