// ============================================================
// Quyền xem bài học — dùng chung cho trang khoá học và trang bài học
// ------------------------------------------------------------
// Được xem khi: bài được đánh dấu xem thử (isPreview), người học đã
// đăng ký khoá học, hoặc là Admin / Staff (kiểm tra nội dung).
// ============================================================

import type { CourseLevel, CourseProgress, Lesson } from "../types/learn.types";

export interface LessonAccessInput {
  lesson: Pick<Lesson, "isPreview">;
  isEnrolled: boolean;
  role?: string;
}

export function canWatchLesson({ lesson, isEnrolled, role }: LessonAccessInput): boolean {
  return Boolean(lesson.isPreview) || isEnrolled || role === "admin" || role === "staff";
}

/** Bài nên học tiếp: bài đầu tiên chưa hoàn thành; xong hết thì về bài 1. */
export function getResumeLesson<T extends Pick<Lesson, "_id">>(
  lessons: T[],
  progress: Pick<CourseProgress, "completedLessons"> | null,
): T | undefined {
  if (lessons.length === 0) return undefined;
  const done = new Set(progress?.completedLessons ?? []);
  return lessons.find((lesson) => !done.has(lesson._id)) ?? lessons[0];
}

/** Nhãn trình độ tiếng Việt (đồng bộ với trang /learn). */
export const COURSE_LEVEL_LABELS: Record<CourseLevel, string> = {
  beginner: "Cơ bản",
  mid: "Trung bình",
  pro: "Nâng cao",
};
