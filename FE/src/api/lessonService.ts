// ============================================================
// Lesson Service — all API calls related to lessons
// ============================================================

import axiosClient from "../lib/axiosClient";
import type { ApiResponse } from "../types/auth.types";
import type {
  Lesson,
  CreateLessonRequest,
  UpdateLessonRequest,
} from "../features/learn/types/learn.types";

const LESSONS_BASE = "/lessons";

// ─── Service ─────────────────────────────────────────────

export const lessonService = {
  /** GET /lessons — Get all lessons (Admin & Staff, requires auth) */
  getAll: () =>
    axiosClient.get<ApiResponse<{ lessons: Lesson[] }>>(LESSONS_BASE),

  /** GET /lessons/{lessonId} — Get lesson detail (public if preview, auth required otherwise) */
  getById: (lessonId: string) => {
    // Defensive: ensure lessonId is a plain string to avoid "[object Object]" in URL
    const id = typeof lessonId === "string" ? lessonId : String(lessonId);
    return axiosClient.get<ApiResponse<{ lesson: Lesson }>>(`${LESSONS_BASE}/${encodeURIComponent(id)}`);
  },

  /** POST /lessons — Create a new standalone lesson (Admin & Staff) */
  create: (data: CreateLessonRequest) =>
    axiosClient.post<ApiResponse<{ lesson: Lesson }>>(LESSONS_BASE, data),

  /** PUT /lessons/{lessonId} — Update a lesson (Admin & Staff) */
  update: (lessonId: string, data: UpdateLessonRequest) =>
    axiosClient.put<ApiResponse<{ lesson: Lesson }>>(`${LESSONS_BASE}/${lessonId}`, data),

  /** DELETE /lessons/{lessonId} — Delete a lesson (Admin & Staff) */
  delete: (lessonId: string) =>
    axiosClient.delete<ApiResponse<{ message: string }>>(`${LESSONS_BASE}/${lessonId}`),
};