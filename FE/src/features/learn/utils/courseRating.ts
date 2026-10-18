import type { Course } from "../types/learn.types";

/** Điểm trung bình của khóa học: BE trả `averageRating`, mock cũ dùng `rating`. */
export function getCourseRating(course: Pick<Course, "averageRating" | "rating">): number {
  return Number(course.averageRating ?? course.rating ?? 0);
}
