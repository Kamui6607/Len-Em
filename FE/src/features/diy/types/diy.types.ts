export interface DIYPost {
  _id: string;
  creatorId: string;
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
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  updatedAt: string;
}

export interface DIYPostFormData {
  title: string;
  description: string;
  images: File[];
  tags: string[];
  linkedProduct?: { productId: string }[];
  linkedCombo?: { comboId: string }[];
  price?: number;
}

export interface CreateDIYPostDTO {
  title: string;
  description: string;
  tags?: string[];
  linkedProduct?: { productId: string }[];
  linkedCombo?: { comboId: string }[];
  price?: number;
  status?: "pending" | "approved" | "rejected";
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
