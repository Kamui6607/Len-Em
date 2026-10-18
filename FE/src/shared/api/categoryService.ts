// ============================================================
// Category Service — GET /categories (danh mục dùng cho video)
// ============================================================

import axiosClient from "../../lib/axiosClient";
import type { ApiResponse } from "../types/auth.types";

export interface Category {
  _id: string;
  name: string;
  slug?: string;
  description?: string;
  isActive?: boolean;
}

export const categoryService = {
  /** GET /categories — Danh mục đang hoạt động (requires auth) */
  getAll: () => axiosClient.get<ApiResponse<{ categories: Category[] }>>("/categories"),
};
