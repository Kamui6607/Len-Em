/**
 * Catalog type definitions used by the shop/mock catalog.
 *
 * These types describe the *frontend* Product shape shown in the catalog,
 * cards and product detail — NOT the raw backend document.
 * The backend shape lives in `./product.types.ts` (`BackendProduct`).
 */

export interface ProductVariant {
  id: string;
  color?: string;
  hexCode?: string;
  stock: number;
  price: number;
  images?: string[];
}

export interface Product {
  id: string;
  name: string;
  category: string;
  tags: string[];
  description: string;
  image: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
  materials?: string[];
  material?: string;
  weight?: string;
  yardage?: number;
  estimatedTime?: string;
  rating: number;
  reviewCount: number;
  popularity: number;
  createdAt: string;
  linkedComboIds?: string[];
  variants?: ProductVariant[];
}