export interface SupportDIYPost {
  _id: string;
  creatorId: string;
  title: string;
  description: string;
  images: string[];
  tags: string[];
  linkedProduct: { productId: string }[];
  linkedCombo: { comboId: string }[];
  price: number;
  status: "Pending" | "Done" | "Cancel";
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupportDIYDTO {
  title: string;
  description: string;
  tags?: string[];
  linkedProduct?: { productId: string }[];
  linkedCombo?: { comboId: string }[];
  price?: number;
}

export interface SupportDIYPostsResponse {
  posts: SupportDIYPost[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}