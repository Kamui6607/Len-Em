export type CourseLevel = "beginner" | "intermediate" | "advanced";

export interface Course {
  id: string;
  title: string;
  thumbnail: string;
  level: CourseLevel;
  type: "premium" | "free_video";  // ← NEW: phân loại
  price?: number;                   // ← NEW: giá cho premium
  pointReward?: number;            // ← NEW: points khi hoàn thành
  purchasedBy?: string[];          // ← NEW: danh sách đã mua
  creator: { id: string; name: string; avatar: string };
  totalLessons: number;
  totalDuration: number; // in minutes
  enrolledCount: number;
  rating: number;
  tags: string[];
  linkedComboIds: string[];
  description?: string;
}

export interface FreeVideo {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  duration: number;               // phút
  level: CourseLevel;
  thumbnail: string;
  creator: { id: string; name: string; avatar: string };
  linkedProducts?: LinkedProduct[];
  tags: string[];
  viewCount: number;
  createdAt: string;
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  videoUrl: string;
  duration: number;
  order: number;
  linkedProducts: LinkedProduct[];
}

export interface LinkedProduct {
  productId: string;
  name: string;
  price: number;
  thumbnail: string;
  timestamp: number;
}

export interface MaterialCombo {
  id: string;
  name: string;
  level: CourseLevel;
  description: string;
  price: number;
  thumbnail: string;
  productIds: string[];
}