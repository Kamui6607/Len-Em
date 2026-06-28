import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import type { ProductReview } from "../../types/review.types";

interface ReviewContextType {
  reviews: ProductReview[];
  addReview: (review: Omit<ProductReview, "id" | "createdAt">) => void;
  getReviewsForProduct: (productId: string) => ProductReview[];
  hasReviewed: (orderId: string, productId: string) => boolean;
}

const ReviewContext = createContext<ReviewContextType | undefined>(undefined);

export function ReviewProvider({ children }: { children: ReactNode }) {
  const [reviews, setReviews] = useState<ProductReview[]>(() => {
    const saved = localStorage.getItem("lenEm_reviews");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("lenEm_reviews", JSON.stringify(reviews));
  }, [reviews]);

  const addReview = useCallback((data: Omit<ProductReview, "id" | "createdAt">) => {
    const newReview: ProductReview = {
      ...data,
      id: `RVW-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setReviews((prev) => [newReview, ...prev]);
  }, []);

  const getReviewsForProduct = useCallback((productId: string) => {
    return reviews.filter((r) => r.productId === productId);
  }, [reviews]);

  const hasReviewed = useCallback((orderId: string, productId: string) => {
    return reviews.some((r) => r.orderId === orderId && r.productId === productId);
  }, [reviews]);

  return (
    <ReviewContext.Provider value={{ reviews, addReview, getReviewsForProduct, hasReviewed }}>
      {children}
    </ReviewContext.Provider>
  );
}

export function useReviews() {
  const context = useContext(ReviewContext);
  if (context === undefined) {
    throw new Error("useReviews must be used within a ReviewProvider");
  }
  return context;
}