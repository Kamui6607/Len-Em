export type CourseLevel = "beginner" | "intermediate" | "advanced";

export interface Course {
  id: string;
  title: string;
  thumbnail: string;
  level: CourseLevel;
  creator: { id: string; name: string; avatar: string };
  totalLessons: number;
  totalDuration: number; // in minutes
  enrolledCount: number;
  rating: number;
  tags: string[]; // e.g. ["scarf", "hat", "bag"]
  linkedComboIds: string[]; // related material combos
  description?: string;
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  videoUrl: string;
  duration: number;
  order: number;
  linkedProducts: LinkedProduct[]; // products tagged in the video
}

export interface LinkedProduct {
  productId: string;
  name: string;
  price: number;
  thumbnail: string;
  timestamp: number; // seconds into video when the suggestion appears
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
