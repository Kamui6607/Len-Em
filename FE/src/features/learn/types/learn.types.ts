export type CourseLevel = "beginner" | "intermediate" | "advanced";

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
  rating: number;
  enrolledCount: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  creator?: { id: string; name: string; avatar: string };
  price?: number;
  pointReward?: number;
  purchasedBy?: string[];
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

export interface FreeVideo {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  duration: number;
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
  _id: string;
  courseId: string;
  title: string;
  videoUrl: string;
  duration: number;
  order: number;
  linkedProduct: { productId: string }[];
  linkedCombo: { comboId: string }[];
  isPreview: boolean;
  createdAt: string;
  updatedAt: string;
  linkedProducts?: LinkedProduct[];
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

// API Request types
export interface CreateCourseRequest {
  title: string;
  description?: string;
  thumbnail?: string;
  level: CourseLevel;
  linkedLessons?: string[];
  tags?: string[];
  linkedCombo?: string[];
  isPublished?: boolean;
}

export interface UpdateCourseRequest {
  title?: string;
  description?: string;
  thumbnail?: string;
  level?: CourseLevel;
  linkedLessons?: string[];
  tags?: string[];
  linkedCombo?: string[];
  isPublished?: boolean;
}

export interface CreateLessonRequest {
  title: string;
  order: number;
  videoUrl: string;
  duration: number;
  linkedProduct?: { productId: string }[];
  linkedCombo?: { comboId: string }[];
  isPreview?: boolean;
}

export interface UpdateLessonRequest {
  title?: string;
  order?: number;
  videoUrl?: string;
  duration?: number;
  linkedProduct?: { productId: string }[];
  linkedCombo?: { comboId: string }[];
  isPreview?: boolean;
}

export interface CourseFormData {
  title: string;
  description: string;
  thumbnail: string;
  level: CourseLevel;
  tags: string[];
  linkedLessons: string[];
  linkedCombo: string[];
  isPublished: boolean;
}

export interface LessonFormData {
  title: string;
  order: number;
  videoUrl: string;
  duration: number;
  linkedProduct: { productId: string }[];
  linkedCombo: { comboId: string }[];
  isPreview: boolean;
}