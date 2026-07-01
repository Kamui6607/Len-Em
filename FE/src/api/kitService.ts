// ============================================================
// Kit Service — API calls related to kits
// ============================================================
// Actual BE response:
//   GET /kits?level=&page=1&limit=10 → { status, data: { kits: Kit[], total, page, limit, totalPages } }
//   GET /kits/{id} → { status, data: { kit: Kit } }
// ============================================================

import axiosClient from "../lib/axiosClient";
import type { ApiResponse } from "../types/auth.types";

export interface KitProduct {
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
}

export interface Kit {
  _id: string;
  name: string;
  description: string;
  thumbnail: string;
  level: "beginner" | "intermediate" | "advanced";
  price: number;
  productIds: KitProduct[];
  isActive: boolean;
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
  /** GET /kits — Get all active kits with filters & pagination */
  getAll: (params?: {
    level?: string;
    page?: number;
    limit?: number;
  }) => axiosClient.get<ApiResponse<RawKitListResponse>>(KITS_BASE, { params }),

  /** GET /kits/{id} — Get kit by ID */
  getById: (id: string) =>
    axiosClient.get<ApiResponse<{ kit: Kit }>>(`${KITS_BASE}/${id}`),
};