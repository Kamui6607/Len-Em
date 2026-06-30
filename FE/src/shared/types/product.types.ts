/**
 * Product types matching the backend response from GET /api/v1/products
 *
 * Backend Product model:
 *   GET /api/v1/products returns { status: "success", data: { products: [...], total, page, limit, totalPages } }
 *   GET /api/v1/products/:id returns { status: "success", data: { product: {...} } }
 *
 * Category enum on backend: yarn | hook | needle | accessory | kit
 * (Frontend mock uses: yarn | tools | kit — we map accordingly in the adapter)
 */

export type BackendCategory = "yarn" | "hook" | "needle" | "accessory" | "kit";
export type FrontendCategory = "yarn" | "tools" | "kit";

export interface BackendProductVariant {
  _idVariants: string;
  color: string;
  hexCode: string;
  price: number;
  stock: number;
  image: string;
  size?: string;
}

export interface BackendProduct {
  _id: string;
  id?: string;
  name: string;
  description: string;
  category: BackendCategory;
  image: string;
  tags: string[];
  variants: BackendProductVariant[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Raw paginated response shape from backend */
export interface BackendPaginatedProducts {
  products: BackendProduct[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Raw single product response shape from backend */
export interface BackendSingleProduct {
  product: BackendProduct;
}

/** Adapter: maps BackendCategory → FrontendCategory */
/**
 * Resolve a potentially relative image URL to an absolute URL.
 * Backend may return relative paths like "cotton-acrylic.jpg"
 * which need to be prefixed with the API base URL.
 */
function resolveImageUrl(url: string | undefined | null): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  // Relative path — prefix with API base URL
  const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";
  // Remove trailing slash from base and ensure leading slash on path
  const cleanBase = base.replace(/\/+$/, "");
  const cleanPath = url.startsWith("/") ? url : `/${url}`;
  return `${cleanBase}${cleanPath}`;
}

export function mapCategory(cat: BackendCategory): FrontendCategory {
  switch (cat) {
    case "hook":
    case "needle":
    case "accessory":
      return "tools";
    case "kit":
      return "kit";
    case "yarn":
      return "yarn";
    default:
      return "tools";
  }
}

/**
 * Adapter: maps a BackendProduct to the legacy Frontend Product shape.
 * Adds default values for fields the mock data had but the backend doesn't.
 */
export interface FrontendProduct {
  id: string;
  name: string;
  category: FrontendCategory;
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
  variants?: FrontendProductVariant[];
  isActive: boolean;
}

export interface FrontendProductVariant {
  id: string;
  color?: string;
  hexCode?: string;
  stock: number;
  price: number;
  images?: string[];
  size?: string;
}

export function adaptBackendProduct(bp: BackendProduct): FrontendProduct {
  return {
    id: bp._id,
    name: bp.name,
    category: mapCategory(bp.category),
    tags: bp.tags ?? [],
    description: bp.description,
    image: resolveImageUrl(bp.image),
    createdAt: bp.createdAt,
    isActive: bp.isActive,
    // Backend doesn't provide these, so we supply defaults
    difficulty: undefined,
    materials: undefined,
    material: undefined,
    weight: undefined,
    yardage: undefined,
    estimatedTime: undefined,
    rating: 0,
    reviewCount: 0,
    popularity: 0,
    linkedComboIds: undefined,
    variants: (bp.variants ?? []).map((v) => ({
      id: v._idVariants,
      color: v.color,
      hexCode: v.hexCode,
      stock: v.stock,
      price: v.price,
      size: v.size,
      images: v.image ? [resolveImageUrl(v.image)] : undefined,
    })),
  };
}