export type CourseLevel = "beginner" | "mid" | "pro";

/**
 * Combo / DIY-kit difficulty — matches the BE kit enum.
 * Kept separate from CourseLevel because kits still use "beginner" | "intermediate" | "advanced".
 */
export type ComboLevel = "beginner" | "intermediate" | "advanced";

export interface Course {
  id: string;
  _id: string;
  title: string;
  description: string;
  thumbnail: string;
  level: CourseLevel;
  linkedLessons: string[];
  tags: string[];
  linkedCombo: { comboId: string }[];
  creatorId: string;
  totalDuration: number;
  totalLessons: number;
  /** Điểm trung bình BE trả về (POST /courses/{id}/rate tính lại). */
  averageRating?: number;
  totalRatings?: number;
  /** Trường cũ (mock) — dữ liệu thật dùng averageRating. */
  rating?: number;
  enrolledCount: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  creator?: { id: string; name: string; avatar: string };
  price?: number;
  pointReward?: number;
  purchasedBy?: string[];
}

/**
 * Persisted course progress returned/synced via:
 *  - GET  /courses/{id}/progress
 *  - POST /courses/{id}/lessons/{lessonId}/complete
 */
export interface CourseProgress {
  userId: string;
  courseId: string;
  completedLessons: string[];
  isCompleted: boolean;
  completedAt?: string | null;
  /** True when admin added a new lesson to an already-completed course. */
  hasNewContent: boolean;
}

export interface CourseListResponse {
  courses: Course[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Lesson {
  id: string;
  _id: string;
  courseId: string;
  title: string;
  videoUrl: string;
  duration: number;
  order: number;
  linkedProduct: LessonLinkedProduct[];
  linkedCombo: { comboId: string }[];
  isPreview: boolean;
  createdAt: string;
  updatedAt: string;
  linkedProducts?: LinkedProduct[];
}

/**
 * Sản phẩm đã populate trong linkedProduct của lesson (GET /lessons, /lessons/:id,
 * /courses/:id). Id variant có thể là `_id` hoặc `_idVariants` tuỳ endpoint.
 */
export interface ProductSummary {
  _id: string;
  name: string;
  category: string;
  image: string;
  variants: {
    _id?: string;
    _idVariants?: string;
    color: string;
    hexCode: string;
    price: number;
    stock: number;
    image?: string;
  }[];
  averageRating?: number;
  totalRatings?: number;
  isActive?: boolean;
}

/** Phần tử linkedProduct trong response lesson — productId đã được populate. */
export interface LessonLinkedProduct {
  productId: string | ProductSummary;
  variantId?: string;
  /** Mốc thời gian trong video, tính bằng giây. */
  timestamp: number;
  note: string;
}

/** Phần tử linkedProduct gửi lên POST/PUT /lessons — productId luôn là ObjectId string. */
export interface LessonLinkedProductInput {
  productId: string;
  variantId?: string;
  timestamp?: number;
  note?: string;
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
  level: ComboLevel;
  description: string;
  price: number;
  thumbnail: string;
  productIds: string[];
}

// API Request types
export interface CreateCourseRequest {
  title: string;
  description?: string;
  thumbnail?: string;
  level: CourseLevel;
  /** Course price in VND — omit or 0 for a free course. */
  price?: number;
  linkedLessons?: string[];
  tags?: string[];
  linkedCombo?: string[];
  linkedProduct?: string[];
  isPublished?: boolean;
}

export interface UpdateCourseRequest {
  title?: string;
  description?: string;
  thumbnail?: string;
  level?: CourseLevel;
  /** Course price in VND — omit or 0 for a free course. */
  price?: number;
  linkedLessons?: string[];
  tags?: string[];
  linkedCombo?: string[];
  linkedProduct?: string[];
  isPublished?: boolean;
}

export interface CreateLessonRequest {
  title: string;
  order: number;
  videoUrl: string;
  duration: number;
  linkedProduct?: LessonLinkedProductInput[];
  linkedCombo?: { comboId: string }[];
  isPreview?: boolean;
}

export interface UpdateLessonRequest {
  title?: string;
  order?: number;
  videoUrl?: string;
  duration?: number;
  linkedProduct?: LessonLinkedProductInput[];
  linkedCombo?: { comboId: string }[];
  isPreview?: boolean;
}

export interface CourseFormData {
  title: string;
  description: string;
  thumbnail: string;
  level: CourseLevel;
  /** Course price in VND — 0 = free course. */
  price: number;
  tags: string[];
  linkedLessons: string[];
  isPublished: boolean;
}

export interface LessonFormData {
  title: string;
  order: number;
  videoUrl: string;
  duration: number;
  linkedProduct: { productId: string; variantId?: string; timestamp: number; note: string }[];
  linkedCombo: { comboId: string }[];
  isPreview: boolean;
}