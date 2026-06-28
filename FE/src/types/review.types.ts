export interface ProductReview {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}