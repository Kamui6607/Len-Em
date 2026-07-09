// ============================================================
// Course Service — all API calls related to courses
// ============================================================

import axiosClient from "../lib/axiosClient";
import type { ApiResponse } from "../types/auth.types";
import type {
  Course,
  CourseListResponse,
  CreateCourseRequest,
  UpdateCourseRequest,
} from "../features/learn/types/learn.types";

const COURSES_BASE = "/courses";

// ─── Service ─────────────────────────────────────────────

export const courseService = {
  /** GET /courses — List published courses (public) */
  getAll: (params?: {
    page?: number;
    limit?: number;
    level?: string;
    tag?: string;
    creatorId?: string;
    sort?: string;
  }) =>
    axiosClient.get<ApiResponse<CourseListResponse>>(COURSES_BASE, { params }),

  /** GET /courses/{id} — Get course by ID with populated lessons (public) */
  getById: (courseId: string) =>
    axiosClient.get<ApiResponse<{ course: Course }>>(`${COURSES_BASE}/${courseId}`),

  /** POST /courses — Create a new course (Admin & Staff) */
  create: (data: CreateCourseRequest) =>
    axiosClient.post<ApiResponse<{ course: Course }>>(COURSES_BASE, data),

  /** PUT /courses/{id} — Update course / publish (Admin & Staff) */
  update: (courseId: string, data: UpdateCourseRequest) =>
    axiosClient.put<ApiResponse<{ course: Course }>>(`${COURSES_BASE}/${courseId}`, data),

  /** DELETE /courses/{id} — Soft delete course (Admin & Staff) */
  delete: (courseId: string) =>
    axiosClient.delete<ApiResponse<{ deletedCourse: { _id: string; title: string } }>>(
      `${COURSES_BASE}/${courseId}`
    ),

  /** POST /courses/{id}/enroll — Enroll in a course (authenticated) */
  enroll: (courseId: string) =>
    axiosClient.post<ApiResponse<{ courseId: string; enrolledCount: number; userEnrolled: boolean }>>(
      `${COURSES_BASE}/${courseId}/enroll`
    ),

  /** POST /courses/{id}/rate — Rate a course (authenticated) */
  rate: (courseId: string, rating: number) =>
    axiosClient.post<ApiResponse<{ message: string }>>(`${COURSES_BASE}/${courseId}/rate`, { rating }),

  /** POST /courses/{id}/lessons/{lessonId} — Link a lesson to a course (Admin & Staff) */
  linkLesson: (courseId: string, lessonId: string) =>
    axiosClient.post<ApiResponse<{ message: string }>>(
      `${COURSES_BASE}/${courseId}/lessons/${lessonId}`
    ),

  /** DELETE /courses/{id}/lessons/{lessonId} — Unlink a lesson from a course (Admin & Staff) */
  unlinkLesson: (courseId: string, lessonId: string) =>
    axiosClient.delete<ApiResponse<{ message: string }>>(
      `${COURSES_BASE}/${courseId}/lessons/${lessonId}`
    ),
};