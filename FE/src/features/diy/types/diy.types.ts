/**
 * Creator info populated by the backend inside `GET /diy-posts`.
 * Replaces the legacy plain-string `creatorId` (kept only as a fallback
 * for mock/demo data).
 */
export interface DIYCreator {
  _id: string;
  username?: string;
  fullName?: string;
  avatar?: string;
}

export interface DIYPost {
  _id: string;
  /** Populated creator object (string only in legacy/mock data). */
  creatorId: string | DIYCreator;
  title: string;
  description: string;
  images: string[];
  tags: string[];
  linkedProduct: { productId: string }[];
  linkedCombo: { comboId: string }[];
  likeCount: number;
  saveCount?: number;
  purchaseCount: number;
  price?: number;
  /** Backend chỉ có 2 trạng thái: "Pending" (chờ duyệt) và "Done" (đã duyệt). */
  status: "Pending" | "Done";
  createdAt: string;
  updatedAt: string;
}

export interface DIYPostFormData {
  title: string;
  description: string;
  images: File[];
  tags: string[];
  linkedProduct?: { productId: string; variantId: string; quantity: number }[];
  linkedCombo?: { comboId: string }[];
  price?: number;
}

/**
 * Body gửi lên POST /diy-posts (bên trong FormData field `data`).
 * Shape khớp schema backend: linkedProduct items yêu cầu đủ
 * { productId, variantId, quantity }; price là tổng giá combo.
 */
export interface CreateDIYPostDTO {
  title: string;
  description: string;
  tags?: string[];
  linkedProduct?: { productId: string; variantId: string; quantity: number }[];
  linkedCombo?: { comboId: string }[];
  price?: number;
}

export interface DIYCombo {
  id: string;
  name: string;
  items: {
    productId: string;
    name: string;
    thumbnail: string;
    price: number;
    quantity: number;
  }[];
  totalPrice: number;
}
