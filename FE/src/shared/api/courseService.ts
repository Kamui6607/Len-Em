// ============================================================
// Course Service â€” all API calls related to courses
// ============================================================

import axiosClient from "../../lib/axiosClient";
import type { ApiResponse } from "../types/auth.types";
import type {
  Course,
  CourseListResponse,
  CourseProgress,
  CreateCourseRequest,
  UpdateCourseRequest,
} from "../../features/learn/types/learn.types";

const COURSES_BASE = "/courses";

// â”€â”€â”€ Service â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const courseService = {
  /** GET /courses â€” List published courses (public) */
  getAll: (params?: {
    page?: number;
    limit?: number;
    level?: string;
    tag?: string;
    creatorId?: string;
    sort?: string;
  }) =>
    axiosClient.get<ApiResponse<CourseListResponse>>(COURSES_BASE, { params }),

  /** GET /courses/{id} â€” Get course by ID with populated lessons (public) */
  getById: (courseId: string) =>
    axiosClient.get<ApiResponse<{ course: Course }>>(`${COURSES_BASE}/${courseId}`),

  /** POST /courses — Create a new course (Admin & Staff, multipart/form-data) */
  create: (data: CreateCourseRequest, thumbnail?: File) => {
    // API expects multipart/form-data: `data` (JSON object) + optional `thumbnail` file.
    const formData = new FormData();
    formData.append("data", JSON.stringify(data));
    if (thumbnail) {
      formData.append("thumbnail", thumbnail);
    }
    return axiosClient.post<ApiResponse<{ course: Course }>>(COURSES_BASE, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 60_000,
    });
  },

  /** PUT /courses/{id} — Update course / publish (Admin & Staff) */
  // BE yêu cầu multipart/form-data: `data` (JSON) + `thumbnail` (file, tùy chọn).
  update: (courseId: string, data: UpdateCourseRequest, thumbnail?: File) => {
    const formData = new FormData();
    formData.append("data", JSON.stringify(data));
    if (thumbnail) {
      formData.append("thumbnail", thumbnail);
    }
    return axiosClient.put<ApiResponse<{ course: Course }>>(`${COURSES_BASE}/${courseId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 60_000,
    });
  },

  /** DELETE /courses/{id} â€” Soft delete course (Admin & Staff) */
  delete: (courseId: string) =>
    axiosClient.delete<ApiResponse<{ deletedCourse: { _id: string; title: string } }>>(
      `${COURSES_BASE}/${courseId}`
    ),

  /** POST /courses/{id}/enroll â€” Enroll in a course (authenticated) */
  enroll: (courseId: string) =>
    axiosClient.post<ApiResponse<{ courseId: string; enrolledCount: number; userEnrolled: boolean }>>(
      `${COURSES_BASE}/${courseId}/enroll`
    ),

  /** POST /courses/{id}/rate â€” Rate a course (authenticated) */
  rate: (courseId: string, rating: number) =>
    axiosClient.post<ApiResponse<{ message: string }>>(`${COURSES_BASE}/${courseId}/rate`, { rating }),

  /** POST /courses/{id}/lessons/{lessonId} â€” Link a lesson to a course (Admin & Staff) */
  linkLesson: (courseId: string, lessonId: string) =>
    axiosClient.post<ApiResponse<{ message: string }>>(
      `${COURSES_BASE}/${courseId}/lessons/${lessonId}`
    ),

  /** DELETE /courses/{id}/lessons/{lessonId} â€” Unlink a lesson from a course (Admin & Staff) */
  unlinkLesson: (courseId: string, lessonId: string) =>
    axiosClient.delete<ApiResponse<{ message: string }>>(
      `${COURSES_BASE}/${courseId}/lessons/${lessonId}`
    ),

  /** GET /courses/{id}/progress â€” Fetch the current user's real course progress */
  getProgress: (courseId: string) =>
    axiosClient.get<ApiResponse<CourseProgress>>(
      `${COURSES_BASE}/${courseId}/progress`
    ),

  /** POST /courses/{id}/lessons/{lessonId}/complete â€” Mark a lesson as watched (server-side) */
  completeLesson: (courseId: string, lessonId: string) =>
    axiosClient.post<ApiResponse<CourseProgress>>(
      `${COURSES_BASE}/${courseId}/lessons/${lessonId}/complete`
    ),
};