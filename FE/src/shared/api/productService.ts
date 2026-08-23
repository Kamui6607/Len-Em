// ============================================================
// Product Service â€” all API calls related to products
// ============================================================

import axiosClient from "../../lib/axiosClient";
import type { ApiResponse } from "../types/auth.types";

const PRODUCTS_BASE = "/products";

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
  const variantsWithoutFiles = variants.map(({ imageFile: _imageFile, ...variant }) => variant);

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

  /** POST /products/{productId}/rate â€” Rate a product with a score 1â€“5 */
  rateProduct: (productId: string, score: number) =>
    axiosClient.post<ApiResponse<{ product: Product }>>(
      `${PRODUCTS_BASE}/${productId}/rate`,
      { score }
    ),
};
