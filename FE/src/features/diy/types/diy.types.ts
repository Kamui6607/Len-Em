export interface DIYPost {
  id: string;
  creator: { id: string; name: string; avatar: string; isIdol: boolean };
  title: string;
  description: string;
  images: string[];
  linkedCombo: DIYCombo;
  likeCount: number;
  saveCount: number;
  createdAt: string;
  tags: string[];
  purchaseCount?: number;
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
