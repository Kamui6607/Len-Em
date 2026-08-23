// ============================================================
// Kit Service â€” API calls related to kits
// ============================================================
// Actual BE response:
//   GET /kits?level=&page=1&limit=10 â†’ { status, data: { kits: Kit[], total, page, limit, totalPages } }
//   GET /kits/{id} â†’ { status, data: { kit: Kit } }
//   POST /kits â€” Create kit (multipart/form-data)
//   PUT /kits/{id} â€” Update kit (multipart/form-data)
//   DELETE /kits/{id} â€” Soft delete kit
//   POST /kits/{id}/rate â€” Rate a kit
// ============================================================

import axiosClient from "../../lib/axiosClient";
import type { ApiResponse } from "../types/auth.types";

export interface KitRating {
  _id: string;
  userId: string;
  score: number;
  createdAt: string;
}

// For reading kit data (GET responses)
// BE returns: products[].productId (populated product object), products[].variantId, products[].quantity
export interface KitProduct {
  productId: {
    _id: string;
    name: string;
    description: string;
    category: string;
    image: string;
    tags: string[];
    variants: {
      _id: string;
      color: string;
      hexCode: string;
      price: number;
      stock: number;
      image: string;
      size?: string;
    }[];
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    __v: number;
  };
  variantId: string;
  quantity: number;
}

// For creating/updating kits (POST/PUT requests)
export interface KitProductInput {
  productId: string;
  variantId: string;
  quantity: number;
}

export interface Kit {
  _id: string;
  name: string;
  description: string;
  thumbnail: string;
  level: "beginner" | "intermediate" | "advanced";
  price: number;
  stock: number;
  products: KitProduct[];
  isActive: boolean;
  averageRating: number;
  totalRatings: number;
  ratings: KitRating[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface RawKitListResponse {
  kits: Kit[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const KITS_BASE = "/kits";

export const kitService = {
  /** GET /kits â€” Get all active kits with filters & pagination */
  getAll: (params?: {
    level?: string;
    page?: number;
    limit?: number;
  }) => axiosClient.get<ApiResponse<RawKitListResponse>>(KITS_BASE, { params }),

  /** GET /kits/{id} â€” Get kit by ID */
  getById: (id: string) =>
    axiosClient.get<ApiResponse<{ kit: Kit }>>(`${KITS_BASE}/${id}`),

  /** GET /kits?ids= â€” Get kits by IDs (comma-separated) */
  getByIds: (ids: string[]) =>
    axiosClient.get<ApiResponse<RawKitListResponse>>(KITS_BASE, { params: { ids: ids.join(",") } }),

  /** POST /kits â€” Create a new kit (Staff/Admin) */
  create: (data: {
    name: string;
    description: string;
    level: "beginner" | "intermediate" | "advanced";
    price?: number;
    stock?: number;
    products: KitProductInput[];
    isActive?: boolean;
  }, thumbnail?: File) => {
    const formData = new FormData();
    formData.append("data", JSON.stringify(data));
    if (thumbnail) {
      formData.append("thumbnail", thumbnail);
    }
    return axiosClient.post<ApiResponse<{ kit: Kit }>>(KITS_BASE, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  /** PUT /kits/{id} â€” Update a kit (Staff/Admin) */
  update: (id: string, data: {
    name?: string;
    description?: string;
    level?: "beginner" | "intermediate" | "advanced";
    price?: number;
    stock?: number;
    products?: KitProductInput[];
    isActive?: boolean;
  }, thumbnail?: File) => {
    const formData = new FormData();
    formData.append("data", JSON.stringify(data));
    if (thumbnail) {
      formData.append("thumbnail", thumbnail);
    }
    return axiosClient.put<ApiResponse<{ kit: Kit }>>(`${KITS_BASE}/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  /** DELETE /kits/{id} â€” Soft delete a kit (Staff/Admin) */
  delete: (id: string) =>
    axiosClient.delete<ApiResponse<{ kit: Kit }>>(`${KITS_BASE}/${id}`),

  /** POST /kits/{id}/rate â€” Rate a kit */
  rate: (id: string, score: number) =>
    axiosClient.post<ApiResponse<{ kit: Kit }>>(`${KITS_BASE}/${id}/rate`, { score }),
};